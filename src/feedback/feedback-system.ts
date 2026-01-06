/**
 * Feedback System
 * 
 * Implements asynchronous feedback incorporation for agents
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Feedback item
 */
export interface FeedbackItem {
  id: string;
  taskId: string;
  artifactId: string;
  author: string;
  comment: string;
  type: 'suggestion' | 'correction' | 'approval' | 'rejection';
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
}

/**
 * Feedback thread
 */
export interface FeedbackThread {
  id: string;
  taskId: string;
  artifactId: string;
  items: FeedbackItem[];
  status: 'open' | 'resolved' | 'closed';
  createdAt: number;
  updatedAt: number;
}

/**
 * Feedback system
 */
export class FeedbackSystem {
  private threads: Map<string, FeedbackThread> = new Map();
  private taskFeedback: Map<string, Set<string>> = new Map();
  private artifactFeedback: Map<string, Set<string>> = new Map();

  /**
   * Create feedback item
   */
  createFeedback(
    taskId: string,
    artifactId: string,
    author: string,
    comment: string,
    type: 'suggestion' | 'correction' | 'approval' | 'rejection' = 'suggestion',
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): FeedbackItem {
    return {
      id: uuidv4(),
      taskId,
      artifactId,
      author,
      comment,
      type,
      severity,
      timestamp: Date.now(),
      resolved: false,
    };
  }

  /**
   * Add feedback to thread
   */
  addFeedback(feedback: FeedbackItem): FeedbackThread {
    const threadId = `${feedback.taskId}-${feedback.artifactId}`;

    let thread = this.threads.get(threadId);

    if (!thread) {
      thread = {
        id: threadId,
        taskId: feedback.taskId,
        artifactId: feedback.artifactId,
        items: [],
        status: 'open',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.threads.set(threadId, thread);

      // Update indexes
      if (!this.taskFeedback.has(feedback.taskId)) {
        this.taskFeedback.set(feedback.taskId, new Set());
      }
      this.taskFeedback.get(feedback.taskId)!.add(threadId);

      if (!this.artifactFeedback.has(feedback.artifactId)) {
        this.artifactFeedback.set(feedback.artifactId, new Set());
      }
      this.artifactFeedback.get(feedback.artifactId)!.add(threadId);
    }

    thread.items.push(feedback);
    thread.updatedAt = Date.now();

    return thread;
  }

  /**
   * Get feedback thread
   */
  getThread(threadId: string): FeedbackThread | undefined {
    return this.threads.get(threadId);
  }

  /**
   * Get feedback for task
   */
  getTaskFeedback(taskId: string): FeedbackThread[] {
    const threadIds = this.taskFeedback.get(taskId);
    if (!threadIds) return [];

    return Array.from(threadIds)
      .map(id => this.threads.get(id)!)
      .filter(thread => thread !== undefined);
  }

  /**
   * Get feedback for artifact
   */
  getArtifactFeedback(artifactId: string): FeedbackThread[] {
    const threadIds = this.artifactFeedback.get(artifactId);
    if (!threadIds) return [];

    return Array.from(threadIds)
      .map(id => this.threads.get(id)!)
      .filter(thread => thread !== undefined);
  }

  /**
   * Resolve feedback
   */
  resolveFeedback(feedbackId: string, resolvedBy: string): FeedbackItem | undefined {
    for (const thread of this.threads.values()) {
      const feedback = thread.items.find(f => f.id === feedbackId);

      if (feedback) {
        feedback.resolved = true;
        feedback.resolvedAt = Date.now();
        feedback.resolvedBy = resolvedBy;
        thread.updatedAt = Date.now();

        // Check if all feedback is resolved
        if (thread.items.every(f => f.resolved)) {
          thread.status = 'resolved';
        }

        return feedback;
      }
    }

    return undefined;
  }

  /**
   * Close thread
   */
  closeThread(threadId: string): FeedbackThread | undefined {
    const thread = this.threads.get(threadId);

    if (thread) {
      thread.status = 'closed';
      thread.updatedAt = Date.now();
    }

    return thread;
  }

  /**
   * Get pending feedback
   */
  getPendingFeedback(taskId?: string): FeedbackItem[] {
    const pending: FeedbackItem[] = [];

    for (const thread of this.threads.values()) {
      if (taskId && thread.taskId !== taskId) continue;

      for (const item of thread.items) {
        if (!item.resolved) {
          pending.push(item);
        }
      }
    }

    return pending.sort((a, b) => {
      // Sort by severity
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Get feedback summary
   */
  getFeedbackSummary(taskId: string): {
    total: number;
    pending: number;
    resolved: number;
    bySeverity: { high: number; medium: number; low: number };
    byType: { suggestion: number; correction: number; approval: number; rejection: number };
  } {
    const feedback = this.getTaskFeedback(taskId).flatMap(t => t.items);

    const summary = {
      total: feedback.length,
      pending: feedback.filter(f => !f.resolved).length,
      resolved: feedback.filter(f => f.resolved).length,
      bySeverity: { high: 0, medium: 0, low: 0 },
      byType: { suggestion: 0, correction: 0, approval: 0, rejection: 0 },
    };

    for (const item of feedback) {
      summary.bySeverity[item.severity]++;
      summary.byType[item.type]++;
    }

    return summary;
  }

  /**
   * Generate feedback report
   */
  generateReport(taskId: string): string {
    const threads = this.getTaskFeedback(taskId);
    const summary = this.getFeedbackSummary(taskId);

    let report = `# Feedback Report for Task ${taskId}\n\n`;

    report += `## Summary\n`;
    report += `- Total Feedback: ${summary.total}\n`;
    report += `- Pending: ${summary.pending}\n`;
    report += `- Resolved: ${summary.resolved}\n\n`;

    report += `## By Severity\n`;
    report += `- High: ${summary.bySeverity.high}\n`;
    report += `- Medium: ${summary.bySeverity.medium}\n`;
    report += `- Low: ${summary.bySeverity.low}\n\n`;

    report += `## By Type\n`;
    report += `- Suggestions: ${summary.byType.suggestion}\n`;
    report += `- Corrections: ${summary.byType.correction}\n`;
    report += `- Approvals: ${summary.byType.approval}\n`;
    report += `- Rejections: ${summary.byType.rejection}\n\n`;

    report += `## Details\n`;

    for (const thread of threads) {
      report += `### Artifact: ${thread.artifactId}\n`;
      report += `Status: ${thread.status}\n\n`;

      for (const item of thread.items) {
        report += `#### ${item.type.toUpperCase()} [${item.severity}]\n`;
        report += `Author: ${item.author}\n`;
        report += `Comment: ${item.comment}\n`;
        report += `Resolved: ${item.resolved ? 'Yes' : 'No'}\n`;
        report += `\n`;
      }
    }

    return report;
  }

  /**
   * Export feedback
   */
  export(): string {
    return JSON.stringify(
      {
        threads: Array.from(this.threads.values()),
        statistics: {
          totalThreads: this.threads.size,
          totalFeedback: Array.from(this.threads.values()).reduce((sum, t) => sum + t.items.length, 0),
        },
      },
      null,
      2
    );
  }

  /**
   * Import feedback
   */
  import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      for (const thread of parsed.threads) {
        this.threads.set(thread.id, thread);

        // Rebuild indexes
        if (!this.taskFeedback.has(thread.taskId)) {
          this.taskFeedback.set(thread.taskId, new Set());
        }
        this.taskFeedback.get(thread.taskId)!.add(thread.id);

        if (!this.artifactFeedback.has(thread.artifactId)) {
          this.artifactFeedback.set(thread.artifactId, new Set());
        }
        this.artifactFeedback.get(thread.artifactId)!.add(thread.id);
      }
    } catch (error) {
      throw new Error(`Failed to import feedback: ${error}`);
    }
  }

  /**
   * Clear feedback
   */
  clear(): void {
    this.threads.clear();
    this.taskFeedback.clear();
    this.artifactFeedback.clear();
  }
}

/**
 * Create feedback system instance
 */
export function createFeedbackSystem(): FeedbackSystem {
  return new FeedbackSystem();
}
