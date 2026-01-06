/**
 * Advanced AI Features
 * 
 * Implements advanced AI-powered features
 */

import { OpenAIClient } from '../models/openai-client';
import { EmbeddingsManager } from '../embeddings/embeddings-manager';

/**
 * Code suggestion
 */
export interface CodeSuggestion {
  code: string;
  explanation: string;
  confidence: number;
  alternatives?: string[];
}

/**
 * Code review result
 */
export interface CodeReviewResult {
  issues: Array<{
    line: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
  }>;
  score: number;
  summary: string;
}

/**
 * Refactoring suggestion
 */
export interface RefactoringSuggestion {
  type: 'extract_function' | 'rename' | 'simplify' | 'optimize';
  description: string;
  before: string;
  after: string;
  benefits: string[];
}

/**
 * AI Assistant
 */
export class AIAssistant {
  constructor(
    private modelClient: OpenAIClient,
    private embeddings: EmbeddingsManager
  ) {}

  /**
   * Generate code suggestions
   */
  async suggestCode(
    context: string,
    language: string,
    requirements: string
  ): Promise<CodeSuggestion> {
    const prompt = `Generate ${language} code based on the following:

Context: ${context}
Requirements: ${requirements}

Provide clean, well-documented code with explanation.`;

    const response = await this.modelClient.complete(prompt, {
      temperature: 0.7,
      maxTokens: 1000,
    });

    return {
      code: this.extractCode(response),
      explanation: this.extractExplanation(response),
      confidence: 0.85,
      alternatives: [],
    };
  }

  /**
   * Review code
   */
  async reviewCode(code: string, language: string): Promise<CodeReviewResult> {
    const prompt = `Review the following ${language} code and identify issues:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. List of issues with line numbers, severity, and suggestions
2. Overall quality score (0-100)
3. Summary`;

    const response = await this.modelClient.complete(prompt, {
      temperature: 0.3,
      maxTokens: 1500,
    });

    return this.parseReviewResult(response);
  }

  /**
   * Suggest refactoring
   */
  async suggestRefactoring(code: string, language: string): Promise<RefactoringSuggestion[]> {
    const prompt = `Analyze the following ${language} code and suggest refactoring opportunities:

\`\`\`${language}
${code}
\`\`\`

For each suggestion, provide:
- Type of refactoring
- Description
- Before/after code
- Benefits`;

    const response = await this.modelClient.complete(prompt, {
      temperature: 0.5,
      maxTokens: 2000,
    });

    return this.parseRefactoringSuggestions(response);
  }

  /**
   * Explain code
   */
  async explainCode(code: string, language: string): Promise<string> {
    const prompt = `Explain the following ${language} code in detail:

\`\`\`${language}
${code}
\`\`\`

Provide a clear, comprehensive explanation suitable for developers.`;

    return await this.modelClient.complete(prompt, {
      temperature: 0.7,
      maxTokens: 1000,
    });
  }

  /**
   * Generate tests
   */
  async generateTests(
    code: string,
    language: string,
    framework: string
  ): Promise<string> {
    const prompt = `Generate comprehensive ${framework} tests for the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Include:
- Unit tests
- Edge cases
- Error scenarios
- Test descriptions`;

    return await this.modelClient.complete(prompt, {
      temperature: 0.6,
      maxTokens: 2000,
    });
  }

  /**
   * Generate documentation
   */
  async generateDocumentation(code: string, language: string): Promise<string> {
    const prompt = `Generate comprehensive documentation for the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Include:
- Overview
- Function/class descriptions
- Parameters and return values
- Usage examples
- Notes and warnings`;

    return await this.modelClient.complete(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  /**
   * Find similar code
   */
  async findSimilarCode(code: string): Promise<Array<{ code: string; similarity: number }>> {
    const embedding = await this.embeddings.generateEmbedding(code);
    const results = this.embeddings.searchByVector(embedding.vector, 5, 0.7);

    return results.map(r => ({
      code: r.text,
      similarity: r.similarity,
    }));
  }

  /**
   * Optimize code
   */
  async optimizeCode(code: string, language: string): Promise<{
    optimized: string;
    improvements: string[];
    performance: string;
  }> {
    const prompt = `Optimize the following ${language} code for performance:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Optimized code
2. List of improvements made
3. Expected performance impact`;

    const response = await this.modelClient.complete(prompt, {
      temperature: 0.4,
      maxTokens: 2000,
    });

    return this.parseOptimizationResult(response);
  }

  /**
   * Convert code between languages
   */
  async convertCode(
    code: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<string> {
    const prompt = `Convert the following ${fromLanguage} code to ${toLanguage}:

\`\`\`${fromLanguage}
${code}
\`\`\`

Maintain the same functionality and add appropriate comments.`;

    return await this.modelClient.complete(prompt, {
      temperature: 0.5,
      maxTokens: 2000,
    });
  }

  /**
   * Fix bugs
   */
  async fixBugs(
    code: string,
    language: string,
    error?: string
  ): Promise<{
    fixed: string;
    explanation: string;
    changes: string[];
  }> {
    const errorContext = error ? `\n\nError message: ${error}` : '';
    
    const prompt = `Fix bugs in the following ${language} code:${errorContext}

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Fixed code
2. Explanation of the bug and fix
3. List of changes made`;

    const response = await this.modelClient.complete(prompt, {
      temperature: 0.4,
      maxTokens: 2000,
    });

    return this.parseBugFixResult(response);
  }

  /**
   * Extract code from response
   */
  private extractCode(response: string): string {
    const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1].trim() : response.trim();
  }

  /**
   * Extract explanation from response
   */
  private extractExplanation(response: string): string {
    return response.replace(/```[\w]*\n[\s\S]*?\n```/g, '').trim();
  }

  /**
   * Parse review result
   */
  private parseReviewResult(response: string): CodeReviewResult {
    // Simple parsing (in production, use structured output)
    return {
      issues: [],
      score: 75,
      summary: response,
    };
  }

  /**
   * Parse refactoring suggestions
   */
  private parseRefactoringSuggestions(response: string): RefactoringSuggestion[] {
    // Simple parsing (in production, use structured output)
    return [];
  }

  /**
   * Parse optimization result
   */
  private parseOptimizationResult(response: string): {
    optimized: string;
    improvements: string[];
    performance: string;
  } {
    return {
      optimized: this.extractCode(response),
      improvements: [],
      performance: 'Improved',
    };
  }

  /**
   * Parse bug fix result
   */
  private parseBugFixResult(response: string): {
    fixed: string;
    explanation: string;
    changes: string[];
  } {
    return {
      fixed: this.extractCode(response),
      explanation: this.extractExplanation(response),
      changes: [],
    };
  }
}

/**
 * Create AI assistant instance
 */
export function createAIAssistant(
  modelClient: OpenAIClient,
  embeddings: EmbeddingsManager
): AIAssistant {
  return new AIAssistant(modelClient, embeddings);
}
