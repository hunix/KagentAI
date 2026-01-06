/**
 * Error Handler
 * 
 * Implements comprehensive error handling and retry logic
 */

/**
 * Error context
 */
export interface ErrorContext {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: number;
  stack?: string;
  context?: Record<string, any>;
}

/**
 * Retry options
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

/**
 * Error handler
 */
export class ErrorHandler {
  private errors: ErrorContext[] = [];
  private maxErrors = 1000;

  /**
   * Log error
   */
  logError(
    code: string,
    message: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'error',
    context?: Record<string, any>,
    stack?: string
  ): ErrorContext {
    const errorContext: ErrorContext = {
      code,
      message,
      severity,
      timestamp: Date.now(),
      stack,
      context,
    };

    this.errors.push(errorContext);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    return errorContext;
  }

  /**
   * Get all errors
   */
  getErrors(severity?: string): ErrorContext[] {
    if (!severity) return this.errors;

    return this.errors.filter(e => e.severity === severity);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ErrorContext[] {
    return this.errors.slice(-limit);
  }

  /**
   * Clear errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getStatistics(): {
    total: number;
    byCode: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const byCode: Record<string, number> = {};
    const bySeverity: Record<string, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };

    for (const error of this.errors) {
      byCode[error.code] = (byCode[error.code] || 0) + 1;
      bySeverity[error.severity]++;
    }

    return {
      total: this.errors.length,
      byCode,
      bySeverity,
    };
  }

  /**
   * Generate error report
   */
  generateReport(): string {
    const stats = this.getStatistics();
    let report = `# Error Report\n\n`;

    report += `## Summary\n`;
    report += `- Total Errors: ${stats.total}\n`;
    report += `- Critical: ${stats.bySeverity.critical}\n`;
    report += `- Errors: ${stats.bySeverity.error}\n`;
    report += `- Warnings: ${stats.bySeverity.warning}\n`;
    report += `- Info: ${stats.bySeverity.info}\n\n`;

    report += `## By Code\n`;
    for (const [code, count] of Object.entries(stats.byCode)) {
      report += `- ${code}: ${count}\n`;
    }

    report += `\n## Recent Errors\n`;
    for (const error of this.getRecentErrors(20)) {
      report += `- [${error.severity.toUpperCase()}] ${error.code}: ${error.message}\n`;
    }

    return report;
  }
}

/**
 * Retry executor
 */
export class RetryExecutor {
  /**
   * Execute with retry
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 100,
      maxDelay = 10000,
      backoffMultiplier = 2,
      shouldRetry = (error) => true,
    } = options;

    let lastError: any;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || !shouldRetry(error, attempt)) {
          throw error;
        }

        // Wait before retry
        await this.sleep(delay);

        // Exponential backoff
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute with timeout
   */
  static async executeWithTimeout<T>(
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
   * Execute with fallback
   */
  static async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      return fallback();
    }
  }

  /**
   * Execute multiple with any success
   */
  static async executeAny<T>(
    fns: Array<() => Promise<T>>
  ): Promise<T> {
    const errors: any[] = [];

    for (const fn of fns) {
      try {
        return await fn();
      } catch (error) {
        errors.push(error);
      }
    }

    throw new Error(`All ${fns.length} operations failed: ${errors.map(e => e.message).join(', ')}`);
  }

  /**
   * Execute all with partial success
   */
  static async executeAll<T>(
    fns: Array<() => Promise<T>>
  ): Promise<{
    results: T[];
    errors: Array<{ index: number; error: any }>;
  }> {
    const results: T[] = [];
    const errors: Array<{ index: number; error: any }> = [];

    for (let i = 0; i < fns.length; i++) {
      try {
        results.push(await fns[i]());
      } catch (error) {
        errors.push({ index: i, error });
      }
    }

    return { results, errors };
  }
}

/**
 * Create error handler instance
 */
export function createErrorHandler(): ErrorHandler {
  return new ErrorHandler();
}

/**
 * Global error handler
 */
let globalErrorHandler: ErrorHandler | null = null;

/**
 * Get global error handler
 */
export function getGlobalErrorHandler(): ErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler();
  }
  return globalErrorHandler;
}

/**
 * Set global error handler
 */
export function setGlobalErrorHandler(handler: ErrorHandler): void {
  globalErrorHandler = handler;
}
