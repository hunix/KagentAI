/**
 * Agent Orchestrator
 * 
 * Orchestrates multi-agent execution using a graph-based workflow
 * Manages agent sequencing, state transitions, and feedback loops
 */

import { v4 as uuidv4 } from 'uuid';
import { OpenAIClient } from '../models/openai-client';
import { StateManager } from '../state/state-manager';
import { ToolRegistry } from '../tools/tool-registry';
import { PromptManager } from '../prompts/prompt-manager';
import { TaskState, AgentRole, ExecutionMode } from './agent-types';
import { BaseAgent } from './base-agent';
import { PlannerAgent } from './planner-agent';
import { ArchitectAgent } from './architect-agent';
import { CoderAgent } from './coder-agent';
import { TesterAgent } from './tester-agent';
import { ReviewerAgent } from './reviewer-agent';

/**
 * Agent node in the execution graph
 */
interface AgentNode {
  role: AgentRole;
  agent: BaseAgent;
  status: 'pending' | 'executing' | 'complete' | 'failed' | 'skipped';
  error?: string;
  startTime?: number;
  endTime?: number;
}

/**
 * Agent graph edge
 */
interface AgentEdge {
  from: AgentRole;
  to: AgentRole;
  condition?: (state: TaskState) => boolean;
}

/**
 * Execution context
 */
interface ExecutionContext {
  taskId: string;
  executionMode: ExecutionMode;
  pausedAt?: AgentRole;
  checkpointId?: string;
  feedback?: any;
}

/**
 * Agent Orchestrator
 */
export class AgentOrchestrator {
  private model: OpenAIClient;
  private stateManager: StateManager;
  private toolRegistry: ToolRegistry;
  private promptManager: PromptManager;
  private agents: Map<AgentRole, BaseAgent> = new Map();
  private graph: Map<AgentRole, AgentEdge[]> = new Map();
  private executionContext: ExecutionContext | null = null;
  private listeners: Map<string, Set<(event: any) => void>> = new Map();

  constructor(
    model: OpenAIClient,
    stateManager: StateManager,
    toolRegistry: ToolRegistry,
    promptManager: PromptManager
  ) {
    this.model = model;
    this.stateManager = stateManager;
    this.toolRegistry = toolRegistry;
    this.promptManager = promptManager;

    // Initialize default graph
    this.initializeDefaultGraph();
  }

  /**
   * Initialize default agent graph
   */
  private initializeDefaultGraph(): void {
    // Define default execution flow: Planner -> Architect -> Coder -> Tester -> Reviewer
    this.graph.set('planner', [
      {
        from: 'planner',
        to: 'architect',
      },
    ]);

    this.graph.set('architect', [
      {
        from: 'architect',
        to: 'coder',
      },
    ]);

    this.graph.set('coder', [
      {
        from: 'coder',
        to: 'tester',
      },
    ]);

    this.graph.set('tester', [
      {
        from: 'tester',
        to: 'reviewer',
      },
    ]);

    this.graph.set('reviewer', []);
  }

  /**
   * Execute a task
   */
  async executeTask(
    taskId: string,
    executionMode: ExecutionMode = 'agent-assisted'
  ): Promise<TaskState> {
    try {
      this.executionContext = {
        taskId,
        executionMode,
      };

      const taskState = this.stateManager.getTaskState(taskId);

      this.emit('task_started', { taskId, mode: executionMode });

      // Execute agents in sequence
      let currentRole: AgentRole = 'planner';

      while (currentRole) {
        // Check if we should pause for user feedback
        if (executionMode === 'agent-assisted') {
          this.emit('awaiting_feedback', { taskId, agent: currentRole });
          // In a real implementation, this would wait for user input
        }

        // Create and execute agent
        const agent = this.createAgent(currentRole, taskId);
        this.agents.set(currentRole, agent);

        this.emit('agent_started', { taskId, agent: currentRole });

        try {
          await agent.execute();
          this.emit('agent_completed', { taskId, agent: currentRole });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.emit('agent_failed', { taskId, agent: currentRole, error: errorMessage });

          if (executionMode === 'agent-driven') {
            throw error;
          }
          // In agent-assisted mode, continue to next agent
        }

        // Get next agent
        const edges = this.graph.get(currentRole) || [];
        const nextEdge = edges.find(e => !e.condition || e.condition(taskState));

        if (nextEdge) {
          currentRole = nextEdge.to;
        } else {
          currentRole = null as any;
        }
      }

      const finalState = this.stateManager.getTaskState(taskId);
      this.emit('task_completed', { taskId, state: finalState });

      return finalState;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('task_failed', { taskId, error: errorMessage });
      throw error;
    } finally {
      this.executionContext = null;
    }
  }

  /**
   * Create an agent instance
   */
  private createAgent(role: AgentRole, taskId: string): BaseAgent {
    switch (role) {
      case 'planner':
        return new PlannerAgent(role, taskId, this.model, this.stateManager, this.toolRegistry, this.promptManager);
      case 'architect':
        return new ArchitectAgent(role, taskId, this.model, this.stateManager, this.toolRegistry, this.promptManager);
      case 'coder':
        return new CoderAgent(role, taskId, this.model, this.stateManager, this.toolRegistry, this.promptManager);
      case 'tester':
        return new TesterAgent(role, taskId, this.model, this.stateManager, this.toolRegistry, this.promptManager);
      case 'reviewer':
        return new ReviewerAgent(role, taskId, this.model, this.stateManager, this.toolRegistry, this.promptManager);
      default:
        throw new Error(`Unknown agent role: ${role}`);
    }
  }

  /**
   * Pause execution at current agent
   */
  pauseExecution(): void {
    if (this.executionContext) {
      this.emit('execution_paused', { taskId: this.executionContext.taskId });
    }
  }

  /**
   * Resume execution
   */
  async resumeExecution(): Promise<void> {
    if (this.executionContext) {
      this.emit('execution_resumed', { taskId: this.executionContext.taskId });
      // Resume logic would be implemented here
    }
  }

  /**
   * Cancel execution
   */
  cancelExecution(): void {
    if (this.executionContext) {
      const taskId = this.executionContext.taskId;
      this.emit('execution_cancelled', { taskId });
      this.executionContext = null;
    }
  }

  /**
   * Provide feedback to current agent
   */
  provideFeedback(feedback: any): void {
    if (this.executionContext) {
      this.executionContext.feedback = feedback;
      this.emit('feedback_provided', { taskId: this.executionContext.taskId, feedback });
    }
  }

  /**
   * Create checkpoint
   */
  createCheckpoint(): string {
    if (!this.executionContext) {
      throw new Error('No execution in progress');
    }

    const checkpointId = this.stateManager.createCheckpoint(this.executionContext.taskId);
    this.executionContext.checkpointId = checkpointId;
    this.emit('checkpoint_created', { taskId: this.executionContext.taskId, checkpointId });

    return checkpointId;
  }

  /**
   * Restore from checkpoint
   */
  restoreCheckpoint(checkpointId: string): void {
    const taskId = this.stateManager.restoreCheckpoint(checkpointId);
    this.emit('checkpoint_restored', { taskId, checkpointId });
  }

  /**
   * Get execution status
   */
  getExecutionStatus(): {
    taskId?: string;
    mode?: ExecutionMode;
    agents: Array<{ role: AgentRole; status: string }>;
    paused: boolean;
  } {
    return {
      taskId: this.executionContext?.taskId,
      mode: this.executionContext?.executionMode,
      agents: Array.from(this.agents.entries()).map(([role, agent]) => ({
        role,
        status: agent.getState().status,
      })),
      paused: !!this.executionContext?.pausedAt,
    };
  }

  /**
   * Get agent
   */
  getAgent(role: AgentRole): BaseAgent | undefined {
    return this.agents.get(role);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Map<AgentRole, BaseAgent> {
    return new Map(this.agents);
  }

  /**
   * Subscribe to orchestrator events
   */
  subscribe(eventType: string, listener: (event: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const listeners = this.listeners.get(eventType)!;
    listeners.add(listener);

    // Return unsubscribe function
    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * Emit event
   */
  private emit(eventType: string, event: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Get execution statistics
   */
  getStatistics(): {
    totalAgents: number;
    completedAgents: number;
    failedAgents: number;
    executionTime: number;
  } {
    let completedAgents = 0;
    let failedAgents = 0;
    let totalExecutionTime = 0;

    for (const agent of this.agents.values()) {
      const state = agent.getState();
      if (state.status === 'complete') {
        completedAgents++;
      } else if (state.status === 'idle' && state.errors.length > 0) {
        failedAgents++;
      }

      if (state.startedAt && state.completedAt) {
        totalExecutionTime += state.completedAt - state.startedAt;
      }
    }

    return {
      totalAgents: this.agents.size,
      completedAgents,
      failedAgents,
      executionTime: totalExecutionTime,
    };
  }

  /**
   * Export execution report
   */
  exportExecutionReport(taskId: string): string {
    const taskState = this.stateManager.getTaskState(taskId);

    let report = `# Execution Report\n\n`;
    report += `**Task**: ${taskState.title}\n`;
    report += `**Status**: ${taskState.status}\n`;
    report += `**Progress**: ${taskState.progress}%\n`;
    report += `**Created**: ${new Date(taskState.createdAt).toISOString()}\n`;
    report += `**Updated**: ${new Date(taskState.updatedAt).toISOString()}\n\n`;

    report += `## Agents\n`;
    for (const agent of taskState.agents) {
      report += `### ${agent.role.toUpperCase()}\n`;
      report += `- Status: ${agent.status}\n`;
      report += `- Progress: ${agent.progress}%\n`;
      report += `- Artifacts: ${agent.artifacts.length}\n`;
      report += `- Errors: ${agent.errors.length}\n`;
      if (agent.completedAt) {
        report += `- Duration: ${agent.completedAt - agent.startedAt}ms\n`;
      }
      report += '\n';
    }

    report += `## Artifacts\n`;
    for (const artifact of taskState.artifacts) {
      report += `- **${artifact.type}**: ${artifact.metadata.summary}\n`;
    }

    if (taskState.errors.length > 0) {
      report += `\n## Errors\n`;
      for (const error of taskState.errors) {
        report += `- [${error.severity}] ${error.message}\n`;
      }
    }

    return report;
  }
}

/**
 * Create an agent orchestrator instance
 */
export function createAgentOrchestrator(
  model: OpenAIClient,
  stateManager: StateManager,
  toolRegistry: ToolRegistry,
  promptManager: PromptManager
): AgentOrchestrator {
  return new AgentOrchestrator(model, stateManager, toolRegistry, promptManager);
}
