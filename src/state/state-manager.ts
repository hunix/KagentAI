/**
 * State Manager
 * 
 * Manages task and agent state with persistence
 * Supports checkpointing and rollback
 */

import { v4 as uuidv4 } from 'uuid';
import {
  TaskState,
  AgentState,
  TaskStatus,
  AgentStatus,
  Artifact,
  UserFeedback,
  ErrorLog,
  ExecutionLogEntry,
} from '../agents/agent-types';

/**
 * State Manager
 */
export class StateManager {
  private taskStates: Map<string, TaskState> = new Map();
  private agentStates: Map<string, AgentState> = new Map();
  private executionLogs: Map<string, ExecutionLogEntry[]> = new Map();
  private checkpoints: Map<string, { taskState: TaskState; agentStates: AgentState[] }> = new Map();
  private listeners: Map<string, Set<(state: TaskState) => void>> = new Map();

  /**
   * Create a new task state
   */
  createTaskState(
    title: string,
    description: string,
    projectPath: string,
    techStack: string[]
  ): TaskState {
    const taskId = uuidv4();
    const state: TaskState = {
      id: taskId,
      title,
      description,
      status: 'pending',
      progress: 0,
      agents: [],
      artifacts: [],
      feedback: [],
      errors: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      context: {
        projectPath,
        techStack,
        codebaseStructure: '',
        existingPatterns: [],
        knowledgeBaseEntries: [],
      },
    };

    this.taskStates.set(taskId, state);
    this.executionLogs.set(taskId, []);
    this.notifyListeners(taskId, state);

    return state;
  }

  /**
   * Create an agent state
   */
  createAgentState(
    taskId: string,
    role: any,
    model: string
  ): AgentState {
    const agentId = uuidv4();
    const state: AgentState = {
      id: agentId,
      role,
      taskId,
      status: 'idle',
      progress: 0,
      artifacts: [],
      errors: [],
      reasoning: [],
      startedAt: Date.now(),
    };

    this.agentStates.set(agentId, state);

    // Add to task's agents
    const taskState = this.taskStates.get(taskId);
    if (taskState) {
      taskState.agents.push(state);
      this.updateTaskState(taskId, { agents: taskState.agents });
    }

    return state;
  }

  /**
   * Update task state
   */
  updateTaskState(taskId: string, updates: Partial<TaskState>): void {
    const state = this.taskStates.get(taskId);
    if (!state) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const updated = {
      ...state,
      ...updates,
      updatedAt: Date.now(),
    };

    this.taskStates.set(taskId, updated);
    this.notifyListeners(taskId, updated);
  }

  /**
   * Update agent state
   */
  updateAgentState(agentId: string, updates: Partial<AgentState>): void {
    const state = this.agentStates.get(agentId);
    if (!state) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const updated = {
      ...state,
      ...updates,
    };

    this.agentStates.set(agentId, updated);

    // Update in task's agents list
    const taskState = this.taskStates.get(state.taskId);
    if (taskState) {
      const agentIndex = taskState.agents.findIndex(a => a.id === agentId);
      if (agentIndex >= 0) {
        taskState.agents[agentIndex] = updated;
        this.updateTaskState(state.taskId, { agents: taskState.agents });
      }
    }
  }

  /**
   * Get task state
   */
  getTaskState(taskId: string): TaskState {
    const state = this.taskStates.get(taskId);
    if (!state) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return state;
  }

  /**
   * Get agent state
   */
  getAgentState(agentId: string): AgentState {
    const state = this.agentStates.get(agentId);
    if (!state) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    return state;
  }

  /**
   * Add artifact to task
   */
  addArtifact(taskId: string, artifact: Artifact): void {
    const state = this.taskStates.get(taskId);
    if (!state) {
      throw new Error(`Task not found: ${taskId}`);
    }

    state.artifacts.push(artifact);
    this.updateTaskState(taskId, { artifacts: state.artifacts });

    // Also add to agent's artifacts
    const agent = state.agents.find(a => a.id === artifact.agentId);
    if (agent) {
      agent.artifacts.push(artifact);
      this.updateAgentState(agent.id, { artifacts: agent.artifacts });
    }
  }

  /**
   * Add feedback to artifact
   */
  addFeedback(taskId: string, artifactId: string, feedback: UserFeedback): void {
    const state = this.taskStates.get(taskId);
    if (!state) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const artifact = state.artifacts.find(a => a.id === artifactId);
    if (artifact) {
      artifact.feedback.push(feedback);
      state.feedback.push(feedback);
      this.updateTaskState(taskId, { artifacts: state.artifacts, feedback: state.feedback });
    }
  }

  /**
   * Add error to task
   */
  addError(taskId: string, error: ErrorLog): void {
    const state = this.taskStates.get(taskId);
    if (!state) {
      throw new Error(`Task not found: ${taskId}`);
    }

    state.errors.push(error);
    this.updateTaskState(taskId, { errors: state.errors });

    // Also add to agent if specified
    if (error.agentId) {
      const agent = state.agents.find(a => a.id === error.agentId);
      if (agent) {
        agent.errors.push(error);
        this.updateAgentState(agent.id, { errors: agent.errors });
      }
    }
  }

  /**
   * Add execution log entry
   */
  addExecutionLog(taskId: string, entry: ExecutionLogEntry): void {
    const logs = this.executionLogs.get(taskId);
    if (!logs) {
      throw new Error(`Task not found: ${taskId}`);
    }

    logs.push(entry);
  }

  /**
   * Get execution log
   */
  getExecutionLog(taskId: string): ExecutionLogEntry[] {
    const logs = this.executionLogs.get(taskId);
    if (!logs) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return [...logs];
  }

  /**
   * Create checkpoint
   */
  createCheckpoint(taskId: string, checkpointId?: string): string {
    const state = this.taskStates.get(taskId);
    if (!state) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const id = checkpointId || `checkpoint-${Date.now()}`;
    const agentStates = state.agents.map(agent => this.agentStates.get(agent.id)!);

    this.checkpoints.set(id, {
      taskState: JSON.parse(JSON.stringify(state)),
      agentStates: JSON.parse(JSON.stringify(agentStates)),
    });

    return id;
  }

  /**
   * Restore from checkpoint
   */
  restoreCheckpoint(checkpointId: string): string {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    const taskId = checkpoint.taskState.id;

    // Restore task state
    this.taskStates.set(taskId, checkpoint.taskState);

    // Restore agent states
    checkpoint.agentStates.forEach(agentState => {
      this.agentStates.set(agentState.id, agentState);
    });

    this.notifyListeners(taskId, checkpoint.taskState);

    return taskId;
  }

  /**
   * List checkpoints for task
   */
  listCheckpoints(taskId: string): Array<{ id: string; timestamp: number }> {
    return Array.from(this.checkpoints.entries())
      .filter(([_, cp]) => cp.taskState.id === taskId)
      .map(([id, cp]) => ({
        id,
        timestamp: cp.taskState.updatedAt,
      }));
  }

  /**
   * Delete checkpoint
   */
  deleteCheckpoint(checkpointId: string): void {
    this.checkpoints.delete(checkpointId);
  }

  /**
   * Subscribe to task state changes
   */
  subscribe(taskId: string, listener: (state: TaskState) => void): () => void {
    if (!this.listeners.has(taskId)) {
      this.listeners.set(taskId, new Set());
    }

    const listeners = this.listeners.get(taskId)!;
    listeners.add(listener);

    // Return unsubscribe function
    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(taskId: string, state: TaskState): void {
    const listeners = this.listeners.get(taskId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(state);
        } catch (error) {
          console.error('Error notifying listener:', error);
        }
      });
    }
  }

  /**
   * Get all tasks
   */
  getAllTasks(): TaskState[] {
    return Array.from(this.taskStates.values());
  }

  /**
   * Delete task
   */
  deleteTask(taskId: string): void {
    const state = this.taskStates.get(taskId);
    if (!state) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Delete all agents
    state.agents.forEach(agent => {
      this.agentStates.delete(agent.id);
    });

    // Delete execution logs
    this.executionLogs.delete(taskId);

    // Delete task
    this.taskStates.delete(taskId);

    // Delete listeners
    this.listeners.delete(taskId);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalAgents: number;
    totalArtifacts: number;
  } {
    const tasks = Array.from(this.taskStates.values());
    const activeTasks = tasks.filter(t => ['pending', 'planning', 'executing', 'verifying'].includes(t.status)).length;
    const completedTasks = tasks.filter(t => t.status === 'complete').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;
    const totalArtifacts = tasks.reduce((sum, t) => sum + t.artifacts.length, 0);

    return {
      totalTasks: tasks.length,
      activeTasks,
      completedTasks,
      failedTasks,
      totalAgents: this.agentStates.size,
      totalArtifacts,
    };
  }

  /**
   * Export task state to JSON
   */
  exportTaskState(taskId: string): string {
    const state = this.getTaskState(taskId);
    return JSON.stringify(state, null, 2);
  }

  /**
   * Import task state from JSON
   */
  importTaskState(json: string): TaskState {
    const state = JSON.parse(json) as TaskState;
    this.taskStates.set(state.id, state);
    this.executionLogs.set(state.id, []);
    this.notifyListeners(state.id, state);
    return state;
  }
}

/**
 * Create a state manager instance
 */
export function createStateManager(): StateManager {
  return new StateManager();
}
