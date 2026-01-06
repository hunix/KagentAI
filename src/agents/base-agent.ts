/**
 * Base Agent Class
 * 
 * Abstract base class for all agent implementations
 */

import { OpenAIClient, Message } from '../models/openai-client';
import { StateManager } from '../state/state-manager';
import { ToolRegistry } from '../tools/tool-registry';
import { PromptManager } from '../prompts/prompt-manager';
import {
  AgentState,
  AgentRole,
  AgentStatus,
  TaskState,
  Artifact,
  ExecutionLogEntry,
  ErrorLog,
} from './agent-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base Agent
 */
export abstract class BaseAgent {
  protected id: string;
  protected role: AgentRole;
  protected taskId: string;
  protected model: OpenAIClient;
  protected stateManager: StateManager;
  protected toolRegistry: ToolRegistry;
  protected promptManager: PromptManager;
  protected state: AgentState;
  protected conversationHistory: Message[] = [];

  constructor(
    role: AgentRole,
    taskId: string,
    model: OpenAIClient,
    stateManager: StateManager,
    toolRegistry: ToolRegistry,
    promptManager: PromptManager
  ) {
    this.id = uuidv4();
    this.role = role;
    this.taskId = taskId;
    this.model = model;
    this.stateManager = stateManager;
    this.toolRegistry = toolRegistry;
    this.promptManager = promptManager;

    // Create agent state
    this.state = stateManager.createAgentState(taskId, role, model.getConfig().model);
  }

  /**
   * Get agent ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get agent role
   */
  getRole(): AgentRole {
    return this.role;
  }

  /**
   * Get agent state
   */
  getState(): AgentState {
    return this.stateManager.getAgentState(this.id);
  }

  /**
   * Update agent status
   */
  protected updateStatus(status: AgentStatus, progress?: number): void {
    const updates: Partial<AgentState> = { status };
    if (progress !== undefined) {
      updates.progress = progress;
    }
    this.stateManager.updateAgentState(this.id, updates);
  }

  /**
   * Add reasoning step
   */
  protected addReasoningStep(step: string): void {
    const state = this.getState();
    state.reasoning.push(step);
    this.stateManager.updateAgentState(this.id, { reasoning: state.reasoning });
  }

  /**
   * Add artifact
   */
  protected addArtifact(artifact: Artifact): void {
    const state = this.getState();
    state.artifacts.push(artifact);
    this.stateManager.updateAgentState(this.id, { artifacts: state.artifacts });
    this.stateManager.addArtifact(this.taskId, artifact);
  }

  /**
   * Add error
   */
  protected addError(message: string, severity: 'info' | 'warning' | 'error' | 'critical' = 'error'): void {
    const error: ErrorLog = {
      id: uuidv4(),
      timestamp: Date.now(),
      agentId: this.id,
      message,
      severity,
      resolved: false,
    };

    const state = this.getState();
    state.errors.push(error);
    this.stateManager.updateAgentState(this.id, { errors: state.errors });
    this.stateManager.addError(this.taskId, error);
  }

  /**
   * Log execution
   */
  protected logExecution(type: string, content: any): void {
    const entry: ExecutionLogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      agentId: this.id,
      type: type as any,
      content,
    };

    this.stateManager.addExecutionLog(this.taskId, entry);
  }

  /**
   * Send message to LLM
   */
  protected async sendMessage(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    try {
      // Get response from model
      const response = await this.model.complete(this.conversationHistory);

      const assistantMessage = response.choices[0].message.content;

      // Add assistant message to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      return assistantMessage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addError(`Failed to get response from LLM: ${errorMessage}`, 'error');
      throw error;
    }
  }

  /**
   * Stream message to LLM
   */
  protected async *streamMessage(userMessage: string): AsyncGenerator<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    let fullResponse = '';

    try {
      for await (const chunk of this.model.stream(this.conversationHistory)) {
        fullResponse += chunk;
        yield chunk;
      }

      // Add full response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addError(`Failed to stream response from LLM: ${errorMessage}`, 'error');
      throw error;
    }
  }

  /**
   * Execute a tool
   */
  protected async executeTool(toolName: string, params: any): Promise<any> {
    try {
      const result = await this.toolRegistry.executeTool(toolName, params);

      this.logExecution('tool_call', {
        toolName,
        input: params,
        output: result.output,
        duration: result.duration,
      });

      if (result.status === 'error') {
        this.addError(`Tool execution failed: ${result.error}`, 'warning');
      }

      return result.output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addError(`Tool execution error: ${errorMessage}`, 'error');
      throw error;
    }
  }

  /**
   * Get available tools for this agent
   */
  protected getAvailableTools(): string[] {
    return this.toolRegistry
      .listToolsForRole(this.role)
      .map(tool => tool.name);
  }

  /**
   * Get task context
   */
  protected getTaskContext(): TaskState {
    return this.stateManager.getTaskState(this.taskId);
  }

  /**
   * Abstract execute method - must be implemented by subclasses
   */
  abstract execute(): Promise<void>;

  /**
   * Pause execution
   */
  pause(): void {
    this.updateStatus('idle');
  }

  /**
   * Resume execution
   */
  resume(): void {
    this.updateStatus('executing');
  }

  /**
   * Cancel execution
   */
  cancel(): void {
    this.updateStatus('idle');
    this.addError('Agent execution cancelled', 'info');
  }

  /**
   * Complete execution
   */
  protected complete(): void {
    this.updateStatus('complete', 100);
    const state = this.getState();
    this.stateManager.updateAgentState(this.id, {
      completedAt: Date.now(),
    });
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(): void {
    this.conversationHistory = [];
  }
}

/**
 * Agent factory
 */
export interface AgentFactory {
  createAgent(
    role: AgentRole,
    taskId: string,
    model: OpenAIClient,
    stateManager: StateManager,
    toolRegistry: ToolRegistry,
    promptManager: PromptManager
  ): BaseAgent;
}
