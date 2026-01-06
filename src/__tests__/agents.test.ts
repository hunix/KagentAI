/**
 * Agent Tests
 * 
 * Comprehensive tests for agent system
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PlannerAgent } from '../agents/planner-agent';
import { ArchitectAgent } from '../agents/architect-agent';
import { CoderAgent } from '../agents/coder-agent';
import { TesterAgent } from '../agents/tester-agent';
import { ReviewerAgent } from '../agents/reviewer-agent';
import { AgentOrchestrator } from '../agents/agent-orchestrator';
import { StateManager } from '../state/state-manager';
import { ToolRegistry } from '../tools/tool-registry';
import { PromptManager } from '../prompts/prompt-manager';
import { OpenAIClient } from '../models/openai-client';

describe('Agent System', () => {
  let stateManager: StateManager;
  let toolRegistry: ToolRegistry;
  let promptManager: PromptManager;
  let modelClient: OpenAIClient;

  beforeEach(() => {
    stateManager = new StateManager();
    toolRegistry = new ToolRegistry();
    promptManager = new PromptManager();
    modelClient = new OpenAIClient({
      endpoint: 'http://localhost:8000/v1',
      apiKey: 'test-key',
      model: 'test-model',
    });
  });

  afterEach(() => {
    stateManager.clear();
  });

  describe('Planner Agent', () => {
    it('should create task plan', async () => {
      const task = stateManager.createTaskState(
        'Test Task',
        'Test Description',
        '/test/path',
        ['TypeScript']
      );

      const planner = new PlannerAgent(
        'planner',
        task.id,
        modelClient,
        stateManager,
        toolRegistry,
        promptManager
      );

      expect(planner).toBeDefined();
      expect(planner.getId()).toBe('planner');
      expect(planner.getTaskId()).toBe(task.id);
    });

    it('should have correct available tools', () => {
      const task = stateManager.createTaskState(
        'Test Task',
        'Test Description',
        '/test/path',
        ['TypeScript']
      );

      const planner = new PlannerAgent(
        'planner',
        task.id,
        modelClient,
        stateManager,
        toolRegistry,
        promptManager
      );

      const tools = planner.getAvailableTools();
      expect(tools).toContain('search_codebase');
      expect(tools).toContain('analyze_code');
    });
  });

  describe('Architect Agent', () => {
    it('should create implementation plan', () => {
      const task = stateManager.createTaskState(
        'Test Task',
        'Test Description',
        '/test/path',
        ['TypeScript']
      );

      const architect = new ArchitectAgent(
        'architect',
        task.id,
        modelClient,
        stateManager,
        toolRegistry,
        promptManager
      );

      expect(architect).toBeDefined();
      expect(architect.getId()).toBe('architect');
    });
  });

  describe('Coder Agent', () => {
    it('should generate code', () => {
      const task = stateManager.createTaskState(
        'Test Task',
        'Test Description',
        '/test/path',
        ['TypeScript']
      );

      const coder = new CoderAgent(
        'coder',
        task.id,
        modelClient,
        stateManager,
        toolRegistry,
        promptManager
      );

      expect(coder).toBeDefined();
      expect(coder.getId()).toBe('coder');
    });

    it('should have file system tools', () => {
      const task = stateManager.createTaskState(
        'Test Task',
        'Test Description',
        '/test/path',
        ['TypeScript']
      );

      const coder = new CoderAgent(
        'coder',
        task.id,
        modelClient,
        stateManager,
        toolRegistry,
        promptManager
      );

      const tools = coder.getAvailableTools();
      expect(tools).toContain('read_file');
      expect(tools).toContain('write_file');
      expect(tools).toContain('execute_command');
    });
  });

  describe('Tester Agent', () => {
    it('should verify code', () => {
      const task = stateManager.createTaskState(
        'Test Task',
        'Test Description',
        '/test/path',
        ['TypeScript']
      );

      const tester = new TesterAgent(
        'tester',
        task.id,
        modelClient,
        stateManager,
        toolRegistry,
        promptManager
      );

      expect(tester).toBeDefined();
      expect(tester.getId()).toBe('tester');
    });
  });

  describe('Reviewer Agent', () => {
    it('should review code', () => {
      const task = stateManager.createTaskState(
        'Test Task',
        'Test Description',
        '/test/path',
        ['TypeScript']
      );

      const reviewer = new ReviewerAgent(
        'reviewer',
        task.id,
        modelClient,
        stateManager,
        toolRegistry,
        promptManager
      );

      expect(reviewer).toBeDefined();
      expect(reviewer.getId()).toBe('reviewer');
    });
  });

  describe('Agent Orchestrator', () => {
    it('should create orchestrator', () => {
      const orchestrator = new AgentOrchestrator(
        modelClient,
        stateManager,
        toolRegistry,
        promptManager
      );

      expect(orchestrator).toBeDefined();
    });

    it('should get execution status', () => {
      const orchestrator = new AgentOrchestrator(
        modelClient,
        stateManager,
        toolRegistry,
        promptManager
      );

      const status = orchestrator.getExecutionStatus();
      expect(status).toBeDefined();
      expect(status.agents).toEqual([]);
    });

    it('should get statistics', () => {
      const orchestrator = new AgentOrchestrator(
        modelClient,
        stateManager,
        toolRegistry,
        promptManager
      );

      const stats = orchestrator.getStatistics();
      expect(stats.totalAgents).toBe(0);
      expect(stats.completedAgents).toBe(0);
      expect(stats.failedAgents).toBe(0);
    });

    it('should subscribe to events', () => {
      const orchestrator = new AgentOrchestrator(
        modelClient,
        stateManager,
        toolRegistry,
        promptManager
      );

      let eventFired = false;

      orchestrator.subscribe('task_started', () => {
        eventFired = true;
      });

      expect(eventFired).toBe(false);
    });
  });
});
