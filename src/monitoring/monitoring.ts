/**
 * Monitoring System
 * 
 * Implements monitoring and logging for Agentic IDE
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Log level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Log entry
 */
export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  stack?: string;
}

/**
 * Metric
 */
export interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Health status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, { status: string; message?: string }>;
  timestamp: number;
}

/**
 * Logger
 */
export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private logLevel: LogLevel = 'info';
  private listeners: Map<LogLevel, Set<(entry: LogEntry) => void>> = new Map();

  constructor(logLevel: LogLevel = 'info') {
    this.logLevel = logLevel;
  }

  /**
   * Log message
   */
  log(level: LogLevel, message: string, context?: Record<string, any>, stack?: string): LogEntry {
    const entry: LogEntry = {
      id: uuidv4(),
      level,
      message,
      timestamp: Date.now(),
      context,
      stack,
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify listeners
    const listeners = this.listeners.get(level);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(entry);
        } catch (error) {
          console.error('Error in log listener:', error);
        }
      });
    }

    return entry;
  }

  /**
   * Debug log
   */
  debug(message: string, context?: Record<string, any>): LogEntry {
    return this.log('debug', message, context);
  }

  /**
   * Info log
   */
  info(message: string, context?: Record<string, any>): LogEntry {
    return this.log('info', message, context);
  }

  /**
   * Warn log
   */
  warn(message: string, context?: Record<string, any>): LogEntry {
    return this.log('warn', message, context);
  }

  /**
   * Error log
   */
  error(message: string, context?: Record<string, any>, stack?: string): LogEntry {
    return this.log('error', message, context, stack);
  }

  /**
   * Fatal log
   */
  fatal(message: string, context?: Record<string, any>, stack?: string): LogEntry {
    return this.log('fatal', message, context, stack);
  }

  /**
   * Subscribe to log level
   */
  subscribe(level: LogLevel, listener: (entry: LogEntry) => void): () => void {
    if (!this.listeners.has(level)) {
      this.listeners.set(level, new Set());
    }

    this.listeners.get(level)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(level)!.delete(listener);
    };
  }

  /**
   * Get logs
   */
  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let logs = this.logs;

    if (level) {
      logs = logs.filter(l => l.level === level);
    }

    return logs.slice(-limit);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get log statistics
   */
  getStatistics(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    };

    for (const log of this.logs) {
      stats[log.level]++;
    }

    return stats;
  }
}

/**
 * Metrics collector
 */
export class MetricsCollector {
  private metrics: Metric[] = [];
  private maxMetrics = 10000;

  /**
   * Record metric
   */
  recordMetric(name: string, value: number, unit: string = '', tags?: Record<string, string>): Metric {
    const metric: Metric = {
      id: uuidv4(),
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    return metric;
  }

  /**
   * Get metrics
   */
  getMetrics(name?: string, limit: number = 100): Metric[] {
    let metrics = this.metrics;

    if (name) {
      metrics = metrics.filter(m => m.name === name);
    }

    return metrics.slice(-limit);
  }

  /**
   * Get metric statistics
   */
  getStatistics(name: string): { min: number; max: number; avg: number; count: number } {
    const metrics = this.metrics.filter(m => m.name === name);

    if (metrics.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }

    const values = metrics.map(m => m.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return { min, max, avg, count: values.length };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * Health checker
 */
export class HealthChecker {
  private checks: Map<string, () => Promise<{ status: string; message?: string }>> = new Map();

  /**
   * Register health check
   */
  registerCheck(name: string, check: () => Promise<{ status: string; message?: string }>): void {
    this.checks.set(name, check);
  }

  /**
   * Check health
   */
  async checkHealth(): Promise<HealthStatus> {
    const results: Record<string, { status: string; message?: string }> = {};

    for (const [name, check] of this.checks.entries()) {
      try {
        results[name] = await check();
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Determine overall status
    const statuses = Object.values(results).map(r => r.status);
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (statuses.includes('unhealthy')) {
      status = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      status = 'degraded';
    }

    return {
      status,
      checks: results,
      timestamp: Date.now(),
    };
  }
}

/**
 * Monitoring system
 */
export class MonitoringSystem {
  private logger: Logger;
  private metrics: MetricsCollector;
  private health: HealthChecker;

  constructor() {
    this.logger = new Logger();
    this.metrics = new MetricsCollector();
    this.health = new HealthChecker();
  }

  /**
   * Get logger
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get metrics
   */
  getMetrics(): MetricsCollector {
    return this.metrics;
  }

  /**
   * Get health checker
   */
  getHealthChecker(): HealthChecker {
    return this.health;
  }

  /**
   * Get full status
   */
  async getFullStatus(): Promise<{
    health: HealthStatus;
    logs: Record<string, number>;
    metrics: number;
  }> {
    return {
      health: await this.health.checkHealth(),
      logs: this.logger.getStatistics(),
      metrics: this.metrics.getMetrics().length,
    };
  }
}

/**
 * Create monitoring system instance
 */
export function createMonitoringSystem(): MonitoringSystem {
  return new MonitoringSystem();
}

/**
 * Global monitoring system
 */
let globalMonitoring: MonitoringSystem | null = null;

/**
 * Get global monitoring system
 */
export function getGlobalMonitoring(): MonitoringSystem {
  if (!globalMonitoring) {
    globalMonitoring = new MonitoringSystem();
  }
  return globalMonitoring;
}
