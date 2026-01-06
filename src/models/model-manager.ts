/**
 * Model Manager
 * 
 * Manages multiple LLM clients, model switching, and configuration
 * Supports text, instruct, multi-modal, fine-tuned models with embeddings and vectors
 */

import * as vscode from 'vscode';
import { OpenAIClient, OpenAIConfig } from './openai-client';

/**
 * Model metadata
 */
export interface ModelMetadata {
  id: string;
  name: string;
  type: 'text' | 'instruct' | 'chat' | 'embedding' | 'multimodal' | 'finetuned';
  contextWindow: number;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsEmbeddings: boolean;
  supportsVision: boolean;
  description?: string;
  tags?: string[];
}

/**
 * Model profile - configuration for a specific model
 */
export interface ModelProfile {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  modelName: string;
  metadata: ModelMetadata;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Model Manager
 */
export class ModelManager {
  private clients: Map<string, OpenAIClient> = new Map();
  private profiles: Map<string, ModelProfile> = new Map();
  private activeProfileId: string = '';
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadProfiles();
  }

  /**
   * Load profiles from configuration
   */
  private loadProfiles(): void {
    const config = vscode.workspace.getConfiguration('agentic.llm');
    
    // Create default profile from settings
    const defaultProfile: ModelProfile = {
      id: 'default',
      name: 'Default Model',
      endpoint: config.get('endpoint') || 'http://localhost:8000/v1',
      apiKey: config.get('apiKey') || 'sk-default',
      modelName: config.get('model') || 'default',
      metadata: {
        id: 'default',
        name: config.get('model') || 'default',
        type: 'chat',
        contextWindow: config.get('contextWindow') || 8000,
        maxTokens: config.get('maxTokens') || 4096,
        supportsStreaming: true,
        supportsEmbeddings: false,
        supportsVision: false,
      },
      temperature: config.get('temperature') || 0.7,
    };

    this.profiles.set('default', defaultProfile);
    this.activeProfileId = 'default';

    // Create client for default profile
    this.createClient(defaultProfile);
  }

  /**
   * Create a new client for a profile
   */
  private createClient(profile: ModelProfile): void {
    const client = new OpenAIClient({
      endpoint: profile.endpoint,
      apiKey: profile.apiKey,
      model: profile.modelName,
      contextWindow: profile.metadata.contextWindow,
      maxTokens: profile.metadata.maxTokens,
      temperature: profile.temperature,
      topP: profile.topP,
      frequencyPenalty: profile.frequencyPenalty,
      presencePenalty: profile.presencePenalty,
    });

    this.clients.set(profile.id, client);
  }

  /**
   * Add a new model profile
   */
  async addProfile(profile: ModelProfile): Promise<void> {
    // Test connection first
    const client = new OpenAIClient({
      endpoint: profile.endpoint,
      apiKey: profile.apiKey,
      model: profile.modelName,
    });

    const isConnected = await client.testConnection();
    if (!isConnected) {
      throw new Error(`Cannot connect to endpoint: ${profile.endpoint}`);
    }

    this.profiles.set(profile.id, profile);
    this.createClient(profile);

    // Save to settings
    await this.saveProfiles();

    vscode.window.showInformationMessage(`Model profile "${profile.name}" added successfully`);
  }

  /**
   * Remove a model profile
   */
  async removeProfile(profileId: string): Promise<void> {
    if (profileId === 'default') {
      throw new Error('Cannot remove default profile');
    }

    this.profiles.delete(profileId);
    this.clients.delete(profileId);

    if (this.activeProfileId === profileId) {
      this.activeProfileId = 'default';
    }

    await this.saveProfiles();
  }

  /**
   * Switch to a different model profile
   */
  switchProfile(profileId: string): void {
    if (!this.profiles.has(profileId)) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    this.activeProfileId = profileId;
  }

  /**
   * Get the active client
   */
  getActiveClient(): OpenAIClient {
    const client = this.clients.get(this.activeProfileId);
    if (!client) {
      throw new Error(`No client for profile: ${this.activeProfileId}`);
    }
    return client;
  }

  /**
   * Get a specific client by profile ID
   */
  getClient(profileId: string): OpenAIClient {
    const client = this.clients.get(profileId);
    if (!client) {
      throw new Error(`No client for profile: ${profileId}`);
    }
    return client;
  }

  /**
   * Get active profile
   */
  getActiveProfile(): ModelProfile {
    const profile = this.profiles.get(this.activeProfileId);
    if (!profile) {
      throw new Error(`Profile not found: ${this.activeProfileId}`);
    }
    return profile;
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): ModelProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get profiles by type
   */
  getProfilesByType(type: ModelMetadata['type']): ModelProfile[] {
    return Array.from(this.profiles.values()).filter(
      profile => profile.metadata.type === type
    );
  }

  /**
   * Update profile configuration
   */
  async updateProfile(profileId: string, updates: Partial<ModelProfile>): Promise<void> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    const updated = { ...profile, ...updates };

    // Test connection if endpoint or API key changed
    if (updates.endpoint || updates.apiKey) {
      const client = new OpenAIClient({
        endpoint: updated.endpoint,
        apiKey: updated.apiKey,
        model: updated.modelName,
      });

      const isConnected = await client.testConnection();
      if (!isConnected) {
        throw new Error(`Cannot connect to endpoint: ${updated.endpoint}`);
      }
    }

    this.profiles.set(profileId, updated);
    this.createClient(updated);

    await this.saveProfiles();
  }

  /**
   * Test a profile connection
   */
  async testProfile(profileId: string): Promise<boolean> {
    const client = this.clients.get(profileId);
    if (!client) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    return await client.testConnection();
  }

  /**
   * List available models from active endpoint
   */
  async listModels(): Promise<Array<{ id: string; object: string; owned_by: string }>> {
    const client = this.getActiveClient();
    return await client.listModels();
  }

  /**
   * Get embedding client (prefer embedding models)
   */
  getEmbeddingClient(): OpenAIClient {
    // Try to find an embedding model
    const embeddingProfile = Array.from(this.profiles.values()).find(
      p => p.metadata.supportsEmbeddings
    );

    if (embeddingProfile) {
      return this.getClient(embeddingProfile.id);
    }

    // Fall back to active client
    return this.getActiveClient();
  }

  /**
   * Get vision/multimodal client
   */
  getVisionClient(): OpenAIClient {
    // Try to find a vision model
    const visionProfile = Array.from(this.profiles.values()).find(
      p => p.metadata.supportsVision || p.metadata.type === 'multimodal'
    );

    if (visionProfile) {
      return this.getClient(visionProfile.id);
    }

    // Fall back to active client
    return this.getActiveClient();
  }

  /**
   * Save profiles to settings
   */
  private async saveProfiles(): Promise<void> {
    const profilesData = Array.from(this.profiles.values()).map(p => ({
      id: p.id,
      name: p.name,
      endpoint: p.endpoint,
      modelName: p.modelName,
      metadata: p.metadata,
      temperature: p.temperature,
    }));

    // Note: API keys should be stored in secure storage
    // This is a simplified version
    await this.context.globalState.update('agentic.modelProfiles', profilesData);
  }

  /**
   * Get statistics about active model
   */
  getActiveModelStats(): {
    profileId: string;
    modelName: string;
    endpoint: string;
    contextWindow: number;
    maxTokens: number;
  } {
    const profile = this.getActiveProfile();
    return {
      profileId: profile.id,
      modelName: profile.modelName,
      endpoint: profile.endpoint,
      contextWindow: profile.metadata.contextWindow,
      maxTokens: profile.metadata.maxTokens,
    };
  }
}

/**
 * Create model manager from extension context
 */
export function createModelManager(context: vscode.ExtensionContext): ModelManager {
  return new ModelManager(context);
}
