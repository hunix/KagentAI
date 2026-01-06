/**
 * Knowledge Base
 * 
 * Implements vector-based knowledge base for pattern reuse and context caching
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Knowledge item
 */
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  embedding?: number[];
  metadata: {
    created: number;
    updated: number;
    usage: number;
    relevance: number;
  };
}

/**
 * Search result
 */
export interface SearchResult {
  item: KnowledgeItem;
  score: number;
}

/**
 * Knowledge Base
 */
export class KnowledgeBase {
  private items: Map<string, KnowledgeItem> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  /**
   * Add item to knowledge base
   */
  addItem(
    title: string,
    content: string,
    category: string,
    tags: string[] = [],
    embedding?: number[]
  ): KnowledgeItem {
    const item: KnowledgeItem = {
      id: uuidv4(),
      title,
      content,
      category,
      tags,
      embedding,
      metadata: {
        created: Date.now(),
        updated: Date.now(),
        usage: 0,
        relevance: 0.5,
      },
    };

    this.items.set(item.id, item);

    // Update indexes
    if (!this.categoryIndex.has(category)) {
      this.categoryIndex.set(category, new Set());
    }
    this.categoryIndex.get(category)!.add(item.id);

    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(item.id);
    }

    return item;
  }

  /**
   * Get item by ID
   */
  getItem(id: string): KnowledgeItem | undefined {
    const item = this.items.get(id);
    if (item) {
      item.metadata.usage++;
      item.metadata.updated = Date.now();
    }
    return item;
  }

  /**
   * Update item
   */
  updateItem(id: string, updates: Partial<KnowledgeItem>): KnowledgeItem | undefined {
    const item = this.items.get(id);
    if (!item) return undefined;

    Object.assign(item, updates);
    item.metadata.updated = Date.now();

    return item;
  }

  /**
   * Delete item
   */
  deleteItem(id: string): boolean {
    const item = this.items.get(id);
    if (!item) return false;

    // Remove from indexes
    const categorySet = this.categoryIndex.get(item.category);
    if (categorySet) {
      categorySet.delete(id);
    }

    for (const tag of item.tags) {
      const tagSet = this.tagIndex.get(tag);
      if (tagSet) {
        tagSet.delete(id);
      }
    }

    this.items.delete(id);
    return true;
  }

  /**
   * Search by category
   */
  searchByCategory(category: string): KnowledgeItem[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];

    return Array.from(ids)
      .map(id => this.items.get(id)!)
      .sort((a, b) => b.metadata.relevance - a.metadata.relevance);
  }

  /**
   * Search by tags
   */
  searchByTags(tags: string[]): KnowledgeItem[] {
    const results = new Map<string, number>();

    for (const tag of tags) {
      const ids = this.tagIndex.get(tag);
      if (!ids) continue;

      for (const id of ids) {
        results.set(id, (results.get(id) || 0) + 1);
      }
    }

    return Array.from(results.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => this.items.get(id)!)
      .filter(item => item !== undefined);
  }

  /**
   * Search by text (simple keyword search)
   */
  searchByText(query: string, limit: number = 10): SearchResult[] {
    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const item of this.items.values()) {
      let score = 0;

      // Title match (higher weight)
      if (item.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // Content match
      if (item.content.toLowerCase().includes(queryLower)) {
        score += 5;
      }

      // Tag match
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          score += 3;
        }
      }

      // Relevance boost
      score *= item.metadata.relevance;

      if (score > 0) {
        results.push({ item, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Vector similarity search (cosine similarity)
   */
  searchByVector(embedding: number[], limit: number = 10): SearchResult[] {
    const results: SearchResult[] = [];

    for (const item of this.items.values()) {
      if (!item.embedding) continue;

      const similarity = this.cosineSimilarity(embedding, item.embedding);

      if (similarity > 0) {
        results.push({ item, score: similarity });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Get all items
   */
  getAllItems(): KnowledgeItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalItems: number;
    categories: number;
    tags: number;
    mostUsed: KnowledgeItem[];
    mostRelevant: KnowledgeItem[];
  } {
    const items = this.getAllItems();

    return {
      totalItems: items.length,
      categories: this.categoryIndex.size,
      tags: this.tagIndex.size,
      mostUsed: items.sort((a, b) => b.metadata.usage - a.metadata.usage).slice(0, 5),
      mostRelevant: items.sort((a, b) => b.metadata.relevance - a.metadata.relevance).slice(0, 5),
    };
  }

  /**
   * Clear knowledge base
   */
  clear(): void {
    this.items.clear();
    this.categoryIndex.clear();
    this.tagIndex.clear();
  }

  /**
   * Export knowledge base
   */
  export(): string {
    return JSON.stringify(
      {
        items: Array.from(this.items.values()),
        categories: Array.from(this.categoryIndex.entries()).map(([cat, ids]) => ({
          category: cat,
          count: ids.size,
        })),
        tags: Array.from(this.tagIndex.entries()).map(([tag, ids]) => ({
          tag,
          count: ids.size,
        })),
      },
      null,
      2
    );
  }

  /**
   * Import knowledge base
   */
  import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      for (const item of parsed.items) {
        this.items.set(item.id, item);

        // Rebuild indexes
        if (!this.categoryIndex.has(item.category)) {
          this.categoryIndex.set(item.category, new Set());
        }
        this.categoryIndex.get(item.category)!.add(item.id);

        for (const tag of item.tags) {
          if (!this.tagIndex.has(tag)) {
            this.tagIndex.set(tag, new Set());
          }
          this.tagIndex.get(tag)!.add(item.id);
        }
      }
    } catch (error) {
      throw new Error(`Failed to import knowledge base: ${error}`);
    }
  }
}

/**
 * Create knowledge base instance
 */
export function createKnowledgeBase(): KnowledgeBase {
  return new KnowledgeBase();
}
