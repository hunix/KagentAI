/**
 * Database Manager
 * 
 * Provides persistent storage for tasks, agents, and artifacts
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Database record
 */
export interface DatabaseRecord {
  id: string;
  collection: string;
  data: any;
  createdAt: number;
  updatedAt: number;
}

/**
 * Query options
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: { field: string; order: 'asc' | 'desc' };
  filter?: Record<string, any>;
}

/**
 * Database manager
 */
export class DatabaseManager extends EventEmitter {
  private dataDir: string;
  private collections: Map<string, Map<string, DatabaseRecord>> = new Map();
  private initialized: boolean = false;

  constructor(dataDir: string) {
    super();
    this.dataDir = dataDir;
  }

  /**
   * Initialize database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create data directory
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Load existing collections
    await this.loadCollections();

    this.initialized = true;
    this.emit('database:initialized');
  }

  /**
   * Create collection
   */
  createCollection(name: string): void {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
      this.emit('collection:created', name);
    }
  }

  /**
   * Insert record
   */
  async insert(collection: string, id: string, data: any): Promise<DatabaseRecord> {
    this.ensureCollection(collection);

    const record: DatabaseRecord = {
      id,
      collection,
      data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.collections.get(collection)!.set(id, record);
    await this.saveCollection(collection);

    this.emit('record:inserted', { collection, id });
    return record;
  }

  /**
   * Update record
   */
  async update(collection: string, id: string, data: any): Promise<DatabaseRecord | null> {
    this.ensureCollection(collection);

    const existing = this.collections.get(collection)!.get(id);
    if (!existing) return null;

    const record: DatabaseRecord = {
      ...existing,
      data: { ...existing.data, ...data },
      updatedAt: Date.now(),
    };

    this.collections.get(collection)!.set(id, record);
    await this.saveCollection(collection);

    this.emit('record:updated', { collection, id });
    return record;
  }

  /**
   * Delete record
   */
  async delete(collection: string, id: string): Promise<boolean> {
    this.ensureCollection(collection);

    const deleted = this.collections.get(collection)!.delete(id);
    if (deleted) {
      await this.saveCollection(collection);
      this.emit('record:deleted', { collection, id });
    }

    return deleted;
  }

  /**
   * Find record by ID
   */
  findById(collection: string, id: string): DatabaseRecord | null {
    this.ensureCollection(collection);
    return this.collections.get(collection)!.get(id) || null;
  }

  /**
   * Find all records
   */
  findAll(collection: string, options?: QueryOptions): DatabaseRecord[] {
    this.ensureCollection(collection);

    let records = Array.from(this.collections.get(collection)!.values());

    // Apply filter
    if (options?.filter) {
      records = records.filter(record => {
        for (const [key, value] of Object.entries(options.filter!)) {
          if (record.data[key] !== value) return false;
        }
        return true;
      });
    }

    // Apply sort
    if (options?.sort) {
      const { field, order } = options.sort;
      records.sort((a, b) => {
        const aVal = a.data[field];
        const bVal = b.data[field];

        if (order === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Apply pagination
    if (options?.offset) {
      records = records.slice(options.offset);
    }

    if (options?.limit) {
      records = records.slice(0, options.limit);
    }

    return records;
  }

  /**
   * Find one record
   */
  findOne(collection: string, filter: Record<string, any>): DatabaseRecord | null {
    const results = this.findAll(collection, { filter, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Count records
   */
  count(collection: string, filter?: Record<string, any>): number {
    return this.findAll(collection, { filter }).length;
  }

  /**
   * Clear collection
   */
  async clearCollection(collection: string): Promise<void> {
    this.ensureCollection(collection);
    this.collections.get(collection)!.clear();
    await this.saveCollection(collection);
    this.emit('collection:cleared', collection);
  }

  /**
   * Drop collection
   */
  async dropCollection(collection: string): Promise<void> {
    this.collections.delete(collection);

    const filePath = path.join(this.dataDir, `${collection}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    this.emit('collection:dropped', collection);
  }

  /**
   * Get all collection names
   */
  getCollections(): string[] {
    return Array.from(this.collections.keys());
  }

  /**
   * Backup database
   */
  async backup(backupPath: string): Promise<void> {
    const backup: Record<string, DatabaseRecord[]> = {};

    for (const [name, collection] of this.collections.entries()) {
      backup[name] = Array.from(collection.values());
    }

    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    this.emit('database:backup', backupPath);
  }

  /**
   * Restore database
   */
  async restore(backupPath: string): Promise<void> {
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    for (const [name, records] of Object.entries(backup)) {
      this.createCollection(name);

      for (const record of records as DatabaseRecord[]) {
        this.collections.get(name)!.set(record.id, record);
      }

      await this.saveCollection(name);
    }

    this.emit('database:restored', backupPath);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalCollections: number;
    totalRecords: number;
    collectionStats: Array<{ name: string; count: number }>;
  } {
    const collectionStats = Array.from(this.collections.entries()).map(
      ([name, collection]) => ({
        name,
        count: collection.size,
      })
    );

    const totalRecords = collectionStats.reduce((sum, stat) => sum + stat.count, 0);

    return {
      totalCollections: this.collections.size,
      totalRecords,
      collectionStats,
    };
  }

  /**
   * Ensure collection exists
   */
  private ensureCollection(name: string): void {
    if (!this.collections.has(name)) {
      this.createCollection(name);
    }
  }

  /**
   * Load collections from disk
   */
  private async loadCollections(): Promise<void> {
    if (!fs.existsSync(this.dataDir)) return;

    const files = fs.readdirSync(this.dataDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const collectionName = file.replace('.json', '');
      const filePath = path.join(this.dataDir, file);

      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const records = JSON.parse(data) as DatabaseRecord[];

        this.createCollection(collectionName);

        for (const record of records) {
          this.collections.get(collectionName)!.set(record.id, record);
        }
      } catch (error) {
        this.emit('database:error', { collection: collectionName, error });
      }
    }
  }

  /**
   * Save collection to disk
   */
  private async saveCollection(name: string): Promise<void> {
    const collection = this.collections.get(name);
    if (!collection) return;

    const records = Array.from(collection.values());
    const filePath = path.join(this.dataDir, `${name}.json`);

    try {
      fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
    } catch (error) {
      this.emit('database:error', { collection: name, error });
    }
  }
}

/**
 * Create database manager instance
 */
export function createDatabaseManager(dataDir: string): DatabaseManager {
  return new DatabaseManager(dataDir);
}
