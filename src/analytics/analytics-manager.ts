/**
 * Analytics Manager
 * 
 * Tracks usage metrics and provides insights
 */

import { EventEmitter } from 'events';

/**
 * Metric type
 */
export type MetricType =
  | 'task_created'
  | 'task_completed'
  | 'task_failed'
  | 'agent_executed'
  | 'tool_used'
  | 'api_call'
  | 'error_occurred';

/**
 * Metric
 */
export interface Metric {
  id: string;
  type: MetricType;
  value: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
}

/**
 * Analytics report
 */
export interface AnalyticsReport {
  period: { start: number; end: number };
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  successRate: number;
  avgExecutionTime: number;
  totalAgentExecutions: number;
  totalToolUsage: number;
  totalAPIcalls: number;
  totalErrors: number;
  topAgents: Array<{ agent: string; count: number }>;
  topTools: Array<{ tool: string; count: number }>;
  errorRate: number;
}

/**
 * Analytics manager
 */
export class AnalyticsManager extends EventEmitter {
  private metrics: Metric[] = [];
  private executionTimes: Map<string, number> = new Map();

  /**
   * Track metric
   */
  trackMetric(
    type: MetricType,
    value: number = 1,
    metadata?: Record<string, any>
  ): void {
    const metric: Metric = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      value,
      metadata,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only last 100000 metrics
    if (this.metrics.length > 100000) {
      this.metrics = this.metrics.slice(-100000);
    }

    this.emit('metric:tracked', metric);
  }

  /**
   * Start timing
   */
  startTiming(id: string): void {
    this.executionTimes.set(id, Date.now());
  }

  /**
   * End timing
   */
  endTiming(id: string): number {
    const startTime = this.executionTimes.get(id);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;
    this.executionTimes.delete(id);

    return duration;
  }

  /**
   * Get metrics
   */
  getMetrics(filters?: {
    type?: MetricType;
    since?: number;
    until?: number;
  }): Metric[] {
    let metrics = this.metrics;

    if (filters?.type) {
      metrics = metrics.filter(m => m.type === filters.type);
    }

    if (filters?.since) {
      metrics = metrics.filter(m => m.timestamp >= filters.since);
    }

    if (filters?.until) {
      metrics = metrics.filter(m => m.timestamp <= filters.until);
    }

    return metrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get time series
   */
  getTimeSeries(
    type: MetricType,
    interval: number,
    period: { start: number; end: number }
  ): TimeSeriesDataPoint[] {
    const metrics = this.getMetrics({
      type,
      since: period.start,
      until: period.end,
    });

    const dataPoints: TimeSeriesDataPoint[] = [];
    const buckets = new Map<number, number>();

    // Group metrics into time buckets
    for (const metric of metrics) {
      const bucket = Math.floor(metric.timestamp / interval) * interval;
      buckets.set(bucket, (buckets.get(bucket) || 0) + metric.value);
    }

    // Convert to array
    for (const [timestamp, value] of buckets.entries()) {
      dataPoints.push({ timestamp, value });
    }

    return dataPoints.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Generate report
   */
  generateReport(period: { start: number; end: number }): AnalyticsReport {
    const metrics = this.getMetrics({ since: period.start, until: period.end });

    const totalTasks = metrics.filter(m => m.type === 'task_created').length;
    const completedTasks = metrics.filter(m => m.type === 'task_completed').length;
    const failedTasks = metrics.filter(m => m.type === 'task_failed').length;
    const totalAgentExecutions = metrics.filter(m => m.type === 'agent_executed').length;
    const totalToolUsage = metrics.filter(m => m.type === 'tool_used').length;
    const totalAPIcalls = metrics.filter(m => m.type === 'api_call').length;
    const totalErrors = metrics.filter(m => m.type === 'error_occurred').length;

    // Calculate success rate
    const successRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average execution time
    const executionTimeMetrics = metrics.filter(
      m => m.type === 'task_completed' && m.metadata?.executionTime
    );
    const avgExecutionTime =
      executionTimeMetrics.length > 0
        ? executionTimeMetrics.reduce(
            (sum, m) => sum + (m.metadata?.executionTime || 0),
            0
          ) / executionTimeMetrics.length
        : 0;

    // Top agents
    const agentCounts = new Map<string, number>();
    metrics
      .filter(m => m.type === 'agent_executed' && m.metadata?.agent)
      .forEach(m => {
        const agent = m.metadata!.agent;
        agentCounts.set(agent, (agentCounts.get(agent) || 0) + 1);
      });

    const topAgents = Array.from(agentCounts.entries())
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top tools
    const toolCounts = new Map<string, number>();
    metrics
      .filter(m => m.type === 'tool_used' && m.metadata?.tool)
      .forEach(m => {
        const tool = m.metadata!.tool;
        toolCounts.set(tool, (toolCounts.get(tool) || 0) + 1);
      });

    const topTools = Array.from(toolCounts.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Error rate
    const errorRate = totalTasks > 0 ? (totalErrors / totalTasks) * 100 : 0;

    return {
      period,
      totalTasks,
      completedTasks,
      failedTasks,
      successRate,
      avgExecutionTime,
      totalAgentExecutions,
      totalToolUsage,
      totalAPIcalls,
      totalErrors,
      topAgents,
      topTools,
      errorRate,
    };
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalMetrics: number;
    metricsToday: number;
    metricsThisWeek: number;
    metricsThisMonth: number;
  } {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    return {
      totalMetrics: this.metrics.length,
      metricsToday: this.metrics.filter(m => m.timestamp > oneDayAgo).length,
      metricsThisWeek: this.metrics.filter(m => m.timestamp > oneWeekAgo).length,
      metricsThisMonth: this.metrics.filter(m => m.timestamp > oneMonthAgo).length,
    };
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThan: number): number {
    const before = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp > olderThan);
    return before - this.metrics.length;
  }

  /**
   * Export metrics
   */
  export(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Import metrics
   */
  import(data: string): void {
    try {
      const metrics = JSON.parse(data) as Metric[];
      this.metrics.push(...metrics);
    } catch (error) {
      throw new Error(`Failed to import metrics: ${error}`);
    }
  }
}

/**
 * Create analytics manager instance
 */
export function createAnalyticsManager(): AnalyticsManager {
  return new AnalyticsManager();
}
