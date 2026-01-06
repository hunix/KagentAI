/**
 * Parallel Executor
 * 
 * Implements parallel execution for agents and tasks
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Execution job
 */
export interface ExecutionJob<T> {
  id: string;
  name: string;
  fn: () => Promise<T>;
  priority?: number;
  timeout?: number;
  retries?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: T;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Execution batch
 */
export interface ExecutionBatch<T> {
  id: string;
  jobs: ExecutionJob<T>[];
  concurrency: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Map<string, T>;
  errors: Map<string, string>;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Parallel executor
 */
export class ParallelExecutor {
  private batches: Map<string, ExecutionBatch<any>> = new Map();
  private activeJobs: Map<string, Promise<any>> = new Map();

  /**
   * Create batch
   */
  createBatch<T>(jobs: Array<{ name: string; fn: () => Promise<T> }>, concurrency: number = 3): ExecutionBatch<T> {
    const batch: ExecutionBatch<T> = {
      id: uuidv4(),
      jobs: jobs.map(job => ({
        id: uuidv4(),
        name: job.name,
        fn: job.fn,
        status: 'pending' as const,
      })),
      concurrency,
      status: 'pending',
      results: new Map(),
      errors: new Map(),
    };

    this.batches.set(batch.id, batch);
    return batch;
  }

  /**
   * Execute batch
   */
  async executeBatch<T>(batchId: string): Promise<{
    results: Map<string, T>;
    errors: Map<string, string>;
    successful: number;
    failed: number;
  }> {
    const batch = this.batches.get(batchId) as ExecutionBatch<T>;

    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    batch.status = 'running';
    batch.startedAt = Date.now();

    const queue = [...batch.jobs];
    const running: Promise<void>[] = [];

    while (queue.length > 0 || running.length > 0) {
      // Start new jobs up to concurrency limit
      while (running.length < batch.concurrency && queue.length > 0) {
        const job = queue.shift()!;
        job.status = 'running';
        job.startedAt = Date.now();

        const jobPromise = this.executeJob(job, batch);
        running.push(jobPromise);
      }

      // Wait for at least one job to complete
      if (running.length > 0) {
        await Promise.race(running.map(p => p.catch(() => {})));

        // Remove completed promises
        running.splice(
          running.findIndex(p => p.then(() => true).catch(() => false)),
          1
        );
      }
    }

    batch.status = 'completed';
    batch.completedAt = Date.now();

    return {
      results: batch.results,
      errors: batch.errors,
      successful: batch.results.size,
      failed: batch.errors.size,
    };
  }

  /**
   * Execute single job
   */
  private async executeJob<T>(job: ExecutionJob<T>, batch: ExecutionBatch<T>): Promise<void> {
    try {
      const result = await job.fn();
      job.result = result;
      job.status = 'completed';
      job.completedAt = Date.now();
      batch.results.set(job.id, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      job.error = errorMessage;
      job.status = 'failed';
      job.completedAt = Date.now();
      batch.errors.set(job.id, errorMessage);
    }
  }

  /**
   * Execute parallel tasks
   */
  async executeParallel<T>(
    tasks: Array<() => Promise<T>>,
    concurrency: number = 3
  ): Promise<{
    results: T[];
    errors: Array<{ index: number; error: string }>;
  }> {
    const batch = this.createBatch(
      tasks.map((fn, index) => ({
        name: `Task ${index}`,
        fn,
      })),
      concurrency
    );

    const result = await this.executeBatch(batch.id);

    return {
      results: Array.from(result.results.values()),
      errors: Array.from(result.errors.entries()).map(([id, error]) => ({
        index: batch.jobs.findIndex(j => j.id === id),
        error,
      })),
    };
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Execute with retry
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 100
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Get batch status
   */
  getBatchStatus<T>(batchId: string): ExecutionBatch<T> | undefined {
    return this.batches.get(batchId) as ExecutionBatch<T>;
  }

  /**
   * Get batch results
   */
  getBatchResults<T>(batchId: string): { results: Map<string, T>; errors: Map<string, string> } | undefined {
    const batch = this.batches.get(batchId) as ExecutionBatch<T>;

    if (!batch) return undefined;

    return {
      results: batch.results,
      errors: batch.errors,
    };
  }

  /**
   * Cancel batch
   */
  cancelBatch(batchId: string): boolean {
    const batch = this.batches.get(batchId);

    if (!batch) return false;

    batch.status = 'failed';
    batch.completedAt = Date.now();

    return true;
  }

  /**
   * Get all batches
   */
  getAllBatches(): ExecutionBatch<any>[] {
    return Array.from(this.batches.values());
  }

  /**
   * Clear completed batches
   */
  clearCompletedBatches(): number {
    let removed = 0;

    for (const [id, batch] of this.batches.entries()) {
      if (batch.status === 'completed' || batch.status === 'failed') {
        this.batches.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get execution statistics
   */
  getStatistics(): {
    totalBatches: number;
    activeBatches: number;
    completedBatches: number;
    failedBatches: number;
    totalJobs: number;
    successfulJobs: number;
    failedJobs: number;
  } {
    const batches = Array.from(this.batches.values());

    return {
      totalBatches: batches.length,
      activeBatches: batches.filter(b => b.status === 'running').length,
      completedBatches: batches.filter(b => b.status === 'completed').length,
      failedBatches: batches.filter(b => b.status === 'failed').length,
      totalJobs: batches.reduce((sum, b) => sum + b.jobs.length, 0),
      successfulJobs: batches.reduce((sum, b) => sum + b.results.size, 0),
      failedJobs: batches.reduce((sum, b) => sum + b.errors.size, 0),
    };
  }
}

/**
 * Create parallel executor instance
 */
export function createParallelExecutor(): ParallelExecutor {
  return new ParallelExecutor();
}
