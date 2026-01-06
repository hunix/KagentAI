/**
 * Agent Factory
 * 
 * Factory for creating agent instances
 */

import { OpenAIClient } from '../models/openai-client';
import { StateManager } from '../state/state-manager';
import { ToolRegistry } from '../tools/tool-registry';
import { PromptManager } from '../prompts/prompt-manager';
import { AgentRole } from './agent-types';
import { BaseAgent } from './base-agent';
import { PlannerAgent } from './planner-agent';
import { ArchitectAgent } from './architect-agent';
import { CoderAgent } from './coder-agent';
import { TesterAgent } from './tester-agent';
import { ReviewerAgent } from './reviewer-agent';

/**
 * Agent Factory
 */
export class AgentFactory {
  constructor(
    private model: OpenAIClient,
    private stateManager: StateManager,
    private toolRegistry: ToolRegistry,
    private promptManager: PromptManager
  ) {}

  /**
   * Create an agent by role
   */
  createAgent(role: AgentRole, taskId: string): BaseAgent {
    switch (role) {
      case 'planner':
        return new PlannerAgent(
          role,
          taskId,
          this.model,
          this.stateManager,
          this.toolRegistry,
          this.promptManager
        );
      case 'architect':
        return new ArchitectAgent(
          role,
          taskId,
          this.model,
          this.stateManager,
          this.toolRegistry,
          this.promptManager
        );
      case 'coder':
        return new CoderAgent(
          role,
          taskId,
          this.model,
          this.stateManager,
          this.toolRegistry,
          this.promptManager
        );
      case 'tester':
        return new TesterAgent(
          role,
          taskId,
          this.model,
          this.stateManager,
          this.toolRegistry,
          this.promptManager
        );
      case 'reviewer':
        return new ReviewerAgent(
          role,
          taskId,
          this.model,
          this.stateManager,
          this.toolRegistry,
          this.promptManager
        );
      default:
        throw new Error(`Unknown agent role: ${role}`);
    }
  }

  /**
   * Create all agents for a task
   */
  createAllAgents(taskId: string): Map<AgentRole, BaseAgent> {
    const agents = new Map<AgentRole, BaseAgent>();

    const roles: AgentRole[] = ['planner', 'architect', 'coder', 'tester', 'reviewer'];

    for (const role of roles) {
      agents.set(role, this.createAgent(role, taskId));
    }

    return agents;
  }

  /**
   * Create agents for specific roles
   */
  createAgentsForRoles(taskId: string, roles: AgentRole[]): Map<AgentRole, BaseAgent> {
    const agents = new Map<AgentRole, BaseAgent>();

    for (const role of roles) {
      agents.set(role, this.createAgent(role, taskId));
    }

    return agents;
  }
}

/**
 * Create an agent factory instance
 */
export function createAgentFactory(
  model: OpenAIClient,
  stateManager: StateManager,
  toolRegistry: ToolRegistry,
  promptManager: PromptManager
): AgentFactory {
  return new AgentFactory(model, stateManager, toolRegistry, promptManager);
}
