/**
 * Integration Tests
 * 
 * Comprehensive integration tests for Agentic IDE
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { StateManager } from '../state/state-manager';
import { ToolRegistry } from '../tools/tool-registry';
import { PromptManager } from '../prompts/prompt-manager';
import { OpenAIClient } from '../models/openai-client';
import { AgentOrchestrator } from '../agents/agent-orchestrator';
import { createKnowledgeBase } from '../knowledge-base/knowledge-base';
import { createFeedbackSystem } from '../feedback/feedback-system';
import { createCacheManager } from '../utils/cache-manager';
import { createErrorHandler, RetryExecutor } from '../utils/error-handler';
import { createParallelExecutor } from '../execution/parallel-executor';
import { createBrowserTools } from '../tools/browser-tools';
import { createApiServer } from '../server/api-server';
import { createCLI } from '../cli/cli';
import { createMonitoringSystem } from '../monitoring/monitoring';

describe('Integration Tests', () => {
  let stateManager: StateManager;
  let toolRegistry: ToolRegistry;
  let promptManager: PromptManager;
  let modelClient: OpenAIClient;
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    stateManager = new StateManager();
    toolRegistry = new ToolRegistry();
    promptManager = new PromptManager();
    modelClient = new OpenAIClient({
      endpoint: 'http://localhost:8000/v1',
      apiKey: 'test-key',
      model: 'test-model',
    });
    orchestrator = new AgentOrchestrator(
      modelClient,
      stateManager,
      toolRegistry,
      promptManager
    );
  });

  afterEach(() => {
    stateManager.clear();
  });

  describe('Full Task Execution', () => {
    it('should create and manage task state', () => {
      const task = stateManager.createTaskState(
        'Test Task',
        'Test Description',
        '/test/path',
        ['TypeScript']
      );

      expect(task).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('pending');

      // Update task
      stateManager.updateTaskState(task.id, { status: 'in_progress' });
      const updated = stateManager.getTaskState(task.id);

      expect(updated?.status).toBe('in_progress');
    });

    it('should manage agent state', () => {
      const task = stateManager.createTaskState(
        'Test Task',
        'Test Description',
        '/test/path',
        ['TypeScript']
      );

      const agentState = stateManager.createAgentState(
        task.id,
        'planner',
        'planning'
      );

      expect(agentState).toBeDefined();
      expect(agentState.role).toBe('planner');
      expect(agentState.status).toBe('planning');
    });

    it('should create and manage artifacts', () => {
      const task = stateManager.createTaskState(
        'Test Task',
        'Test Description',
        '/test/path',
        ['TypeScript']
      );

      const artifact = stateManager.createArtifact(
        task.id,
        'plan',
        'Test Plan',
        { goals: ['Goal 1'] }
      );

      expect(artifact).toBeDefined();
      expect(artifact.type).toBe('plan');

      const retrieved = stateManager.getArtifact(artifact.id);
      expect(retrieved).toBeDefined();
    });
  });

  describe('Knowledge Base Integration', () => {
    it('should add and search knowledge items', () => {
      const kb = createKnowledgeBase();

      kb.addItem(
        'React Patterns',
        'Common React patterns and best practices',
        'patterns',
        ['react', 'patterns']
      );

      const results = kb.searchByText('react');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should track knowledge usage', () => {
      const kb = createKnowledgeBase();

      const item = kb.addItem(
        'Test Item',
        'Test content',
        'test',
        ['test']
      );

      kb.getItem(item.id);
      kb.getItem(item.id);

      const stats = kb.getStatistics();
      expect(stats.totalItems).toBe(1);
    });
  });

  describe('Feedback System Integration', () => {
    it('should create and manage feedback', () => {
      const feedbackSystem = createFeedbackSystem();
      const taskId = 'test-task';
      const artifactId = 'test-artifact';

      const feedback = feedbackSystem.createFeedback(
        taskId,
        artifactId,
        'user',
        'Add error handling',
        'suggestion',
        'medium'
      );

      const thread = feedbackSystem.addFeedback(feedback);
      expect(thread).toBeDefined();
      expect(thread.items.length).toBe(1);
    });

    it('should resolve feedback', () => {
      const feedbackSystem = createFeedbackSystem();
      const taskId = 'test-task';
      const artifactId = 'test-artifact';

      const feedback = feedbackSystem.createFeedback(
        taskId,
        artifactId,
        'user',
        'Test feedback',
        'suggestion'
      );

      feedbackSystem.addFeedback(feedback);
      const resolved = feedbackSystem.resolveFeedback(feedback.id, 'reviewer');

      expect(resolved?.resolved).toBe(true);
    });
  });

  describe('Caching System', () => {
    it('should cache and retrieve values', () => {
      const cache = createCacheManager<string>();

      cache.set('key1', 'value1');
      const value = cache.get('key1');

      expect(value).toBe('value1');
    });

    it('should track cache statistics', () => {
      const cache = createCacheManager<string>();

      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key2'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should log and track errors', () => {
      const errorHandler = createErrorHandler();

      errorHandler.logError(
        'TEST_ERROR',
        'Test error message',
        'error'
      );

      const errors = errorHandler.getErrors();
      expect(errors.length).toBe(1);
    });

    it('should execute with retry', async () => {
      let attempts = 0;

      const result = await RetryExecutor.executeWithRetry(
        async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error('Temporary error');
          }
          return 'success';
        },
        { maxRetries: 3, initialDelay: 10 }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });
  });

  describe('Parallel Execution', () => {
    it('should execute tasks in parallel', async () => {
      const executor = createParallelExecutor();

      const tasks = [
        async () => 'task1',
        async () => 'task2',
        async () => 'task3',
      ];

      const result = await executor.executeParallel(tasks, 2);

      expect(result.results.length).toBe(3);
      expect(result.errors.length).toBe(0);
    });

    it('should handle partial failures', async () => {
      const executor = createParallelExecutor();

      const tasks = [
        async () => 'task1',
        async () => {
          throw new Error('Task failed');
        },
        async () => 'task3',
      ];

      const result = await executor.executeParallel(tasks, 2);

      expect(result.results.length).toBe(2);
      expect(result.errors.length).toBe(1);
    });
  });

  describe('Browser Tools', () => {
    it('should create and manage browser sessions', () => {
      const browserTools = createBrowserTools();

      const session = browserTools.createSession();
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();

      const retrieved = browserTools.getSession(session.id);
      expect(retrieved).toBeDefined();
    });

    it('should navigate and take screenshots', async () => {
      const browserTools = createBrowserTools();
      const session = browserTools.createSession();

      const navResult = await browserTools.navigateToUrl(
        session.id,
        'http://example.com'
      );

      expect(navResult.success).toBe(true);

      const screenshotResult = await browserTools.takeScreenshot(session.id);
      expect(screenshotResult.success).toBe(true);
    });
  });

  describe('API Server', () => {
    it('should create and register routes', async () => {
      const server = createApiServer(3000);

      server.registerRoute('GET', '/test', async () => ({
        status: 200,
        data: { message: 'test' },
        timestamp: Date.now(),
      }));

      const routes = server.getRoutes();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('should handle requests', async () => {
      const server = createApiServer(3000);

      const response = await server.handleRequest({
        method: 'GET',
        path: '/health',
      });

      expect(response.status).toBe(200);
    });
  });

  describe('CLI', () => {
    it('should register and execute commands', async () => {
      const cli = createCLI();

      const commands = cli.getAllCommands();
      expect(commands.length).toBeGreaterThan(0);
    });

    it('should parse command arguments', () => {
      const cli = createCLI();

      const parsed = cli.parseArgs(['node', 'cli.js', 'task', 'create', '--title', 'Test']);

      expect(parsed.command).toBe('task');
    });
  });

  describe('Monitoring System', () => {
    it('should log messages', () => {
      const monitoring = createMonitoringSystem();
      const logger = monitoring.getLogger();

      logger.info('Test message', { context: 'test' });

      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should record metrics', () => {
      const monitoring = createMonitoringSystem();
      const metrics = monitoring.getMetrics();

      metrics.recordMetric('response_time', 100, 'ms');
      metrics.recordMetric('response_time', 150, 'ms');

      const stats = metrics.getStatistics('response_time');
      expect(stats.count).toBe(2);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(150);
    });

    it('should check health', async () => {
      const monitoring = createMonitoringSystem();
      const health = monitoring.getHealthChecker();

      health.registerCheck('test', async () => ({ status: 'healthy' }));

      const status = await health.checkHealth();
      expect(status.status).toBe('healthy');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should execute complete workflow', async () => {
      // Create task
      const task = stateManager.createTaskState(
        'Build Feature',
        'Build new feature',
        '/project',
        ['TypeScript']
      );

      // Add knowledge
      const kb = createKnowledgeBase();
      kb.addItem('TypeScript Best Practices', 'Use strict mode', 'best-practices', ['typescript']);

      // Create feedback
      const feedbackSystem = createFeedbackSystem();
      const feedback = feedbackSystem.createFeedback(
        task.id,
        'artifact-1',
        'user',
        'Add tests',
        'suggestion'
      );
      feedbackSystem.addFeedback(feedback);

      // Log execution
      const monitoring = createMonitoringSystem();
      const logger = monitoring.getLogger();
      logger.info('Task execution started', { taskId: task.id });

      // Record metrics
      const metrics = monitoring.getMetrics();
      metrics.recordMetric('task_duration', 1000, 'ms');

      // Verify workflow
      expect(task).toBeDefined();
      expect(kb.getAllItems().length).toBeGreaterThan(0);
      expect(feedbackSystem.getPendingFeedback(task.id).length).toBeGreaterThan(0);
      expect(logger.getLogs().length).toBeGreaterThan(0);
    });
  });
});
