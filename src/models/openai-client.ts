/**
 * Generic OpenAI-Compatible LLM Client
 * 
 * Supports any OpenAI-compatible API including:
 * - LM Studio (local GPU server)
 * - Ollama
 * - OpenAI
 * - Anthropic Claude (via OpenAI-compatible adapter)
 * - Azure OpenAI
 * - Any custom OpenAI-compatible endpoint
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration for OpenAI-compatible API
 */
export interface OpenAIConfig {
  endpoint: string;           // Base URL (e.g., http://localhost:8000/v1)
  apiKey: string;             // API key (can be dummy for local models)
  model: string;              // Model name
  contextWindow?: number;     // Max context tokens (default: 8000)
  maxTokens?: number;         // Max output tokens (default: 4096)
  temperature?: number;       // Sampling temperature (default: 0.7)
  topP?: number;              // Top-p sampling (default: 1.0)
  frequencyPenalty?: number;  // Frequency penalty (default: 0)
  presencePenalty?: number;   // Presence penalty (default: 0)
  timeout?: number;           // Request timeout in ms (default: 30000)
}

/**
 * Message format for conversations
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentBlock[];
}

/**
 * Content block for multi-modal support
 */
export interface ContentBlock {
  type: 'text' | 'image_url' | 'image_base64';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
  image_base64?: {
    data: string;
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  };
}

/**
 * Completion response
 */
export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: Message;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Streaming completion response
 */
export interface StreamingCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

/**
 * Embedding response
 */
export interface EmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Token counting response
 */
export interface TokenCountResponse {
  tokens: number;
  model: string;
}

/**
 * Generic OpenAI-Compatible Client
 */
export class OpenAIClient {
  private config: OpenAIConfig;
  private client: AxiosInstance;
  private requestId: string = uuidv4();

  constructor(config: OpenAIConfig) {
    this.config = {
      contextWindow: 8000,
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0,
      timeout: 30000,
      ...config,
    };

    // Ensure endpoint doesn't have trailing slash
    this.config.endpoint = this.config.endpoint.replace(/\/$/, '');

    // Create axios instance with default headers
    this.client = axios.create({
      baseURL: this.config.endpoint,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Agentic-IDE/0.1.0',
      },
      timeout: this.config.timeout,
    });
  }

  /**
   * Send a completion request to the LLM
   */
  async complete(
    messages: Message[],
    options?: Partial<OpenAIConfig>
  ): Promise<CompletionResponse> {
    const config = { ...this.config, ...options };

    try {
      const response = await this.client.post<CompletionResponse>(
        '/chat/completions',
        {
          model: config.model,
          messages: this.formatMessages(messages),
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          top_p: config.topP,
          frequency_penalty: config.frequencyPenalty,
          presence_penalty: config.presencePenalty,
          stream: false,
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Stream a completion request
   */
  async *stream(
    messages: Message[],
    options?: Partial<OpenAIConfig>
  ): AsyncGenerator<string, void, unknown> {
    const config = { ...this.config, ...options };

    try {
      const response = await this.client.post(
        '/chat/completions',
        {
          model: config.model,
          messages: this.formatMessages(messages),
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          top_p: config.topP,
          frequency_penalty: config.frequencyPenalty,
          presence_penalty: config.presencePenalty,
          stream: true,
        },
        {
          responseType: 'stream',
        }
      );

      for await (const line of this.readStream(response.data)) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(data) as StreamingCompletionResponse;
            if (parsed.choices[0]?.delta?.content) {
              yield parsed.choices[0].delta.content;
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate embeddings for text
   */
  async embed(
    input: string | string[],
    model?: string
  ): Promise<EmbeddingResponse> {
    try {
      const response = await this.client.post<EmbeddingResponse>(
        '/embeddings',
        {
          model: model || this.config.model,
          input: Array.isArray(input) ? input : [input],
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Count tokens in text (if supported by endpoint)
   */
  async countTokens(text: string): Promise<number> {
    try {
      // Try OpenAI-compatible token counting endpoint
      const response = await this.client.post<TokenCountResponse>(
        '/tokenize',
        {
          model: this.config.model,
          text: text,
        }
      );

      return response.data.tokens;
    } catch (error) {
      // Fallback: estimate tokens (rough approximation)
      // Most models: ~4 characters per token
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Get available models from endpoint
   */
  async listModels(): Promise<Array<{ id: string; object: string; owned_by: string }>> {
    try {
      const response = await this.client.get('/models');
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Test connection to endpoint
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      return Array.isArray(response.data.data);
    } catch (error) {
      return false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update axios instance if endpoint or API key changed
    if (config.endpoint || config.apiKey) {
      const endpoint = config.endpoint || this.config.endpoint;
      const apiKey = config.apiKey || this.config.apiKey;
      
      this.client = axios.create({
        baseURL: endpoint.replace(/\/$/, ''),
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Agentic-IDE/0.1.0',
        },
        timeout: this.config.timeout,
      });
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): OpenAIConfig {
    return { ...this.config };
  }

  /**
   * Format messages for API compatibility
   */
  private formatMessages(messages: Message[]): Message[] {
    return messages.map(msg => ({
      role: msg.role,
      content: Array.isArray(msg.content)
        ? msg.content.map(block => this.formatContentBlock(block))
        : msg.content,
    }));
  }

  /**
   * Format content block for multi-modal support
   */
  private formatContentBlock(block: ContentBlock): any {
    switch (block.type) {
      case 'text':
        return { type: 'text', text: block.text };
      case 'image_url':
        return { type: 'image_url', image_url: block.image_url };
      case 'image_base64':
        return {
          type: 'image_url',
          image_url: {
            url: `data:${block.image_base64?.media_type};base64,${block.image_base64?.data}`,
          },
        };
      default:
        return block;
    }
  }

  /**
   * Read streaming response
   */
  private async *readStream(stream: any): AsyncGenerator<string> {
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          yield line;
        }
      }
    }

    if (buffer.trim()) {
      yield buffer;
    }
  }

  /**
   * Handle errors from API
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as any;
      const message = data?.error?.message || error.message;

      switch (status) {
        case 401:
          return new Error(`Authentication failed: ${message}`);
        case 404:
          return new Error(`Endpoint not found: ${this.config.endpoint}`);
        case 429:
          return new Error(`Rate limited: ${message}`);
        case 500:
          return new Error(`Server error: ${message}`);
        default:
          return new Error(`API error (${status}): ${message}`);
      }
    }

    return error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Create a client from configuration
 */
export function createOpenAIClient(config: OpenAIConfig): OpenAIClient {
  return new OpenAIClient(config);
}

/**
 * Create a client from environment variables
 */
export function createClientFromEnv(): OpenAIClient {
  const endpoint = process.env.OPENAI_API_BASE || 'http://localhost:8000/v1';
  const apiKey = process.env.OPENAI_API_KEY || 'sk-default';
  const model = process.env.OPENAI_MODEL || 'default';

  return new OpenAIClient({
    endpoint,
    apiKey,
    model,
  });
}
