/**
 * Custom Agent Creation Framework
 * 
 * Allows users to create custom agents with predefined interfaces
 */

import { BaseAgent } from '../agents/base-agent';
import { AgentContext, AgentResult } from '../agents/agent-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent template
 */
export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  prompt: string;
  tools: string[];
  config: Record<string, any>;
  createdAt: number;
}

/**
 * Custom agent definition
 */
export interface CustomAgentDefinition {
  name: string;
  description: string;
  systemPrompt: string;
  tools?: string[];
  config?: Record<string, any>;
  beforeExecute?: (context: AgentContext) => Promise<void>;
  afterExecute?: (result: AgentResult) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
}

/**
 * Custom agent class
 */
export class CustomAgent extends BaseAgent {
  private definition: CustomAgentDefinition;

  constructor(definition: CustomAgentDefinition, context: AgentContext) {
    super(
      definition.name,
      definition.description,
      definition.systemPrompt,
      context
    );

    this.definition = definition;
  }

  /**
   * Execute custom agent
   */
  async execute(): Promise<AgentResult> {
    try {
      // Before execute hook
      if (this.definition.beforeExecute) {
        await this.definition.beforeExecute(this.context);
      }

      // Execute agent logic
      const result = await this.executeInternal();

      // After execute hook
      if (this.definition.afterExecute) {
        await this.definition.afterExecute(result);
      }

      return result;
    } catch (error) {
      // Error hook
      if (this.definition.onError) {
        await this.definition.onError(error as Error);
      }

      throw error;
    }
  }

  /**
   * Internal execution logic
   */
  private async executeInternal(): Promise<AgentResult> {
    const prompt = this.buildPrompt();

    const response = await this.context.modelClient.complete(prompt, {
      temperature: this.definition.config?.temperature || 0.7,
      maxTokens: this.definition.config?.maxTokens || 2000,
    });

    return {
      success: true,
      output: response,
      artifacts: [],
      metadata: {
        agent: this.name,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Build prompt
   */
  private buildPrompt(): string {
    const taskDescription = this.context.task.description;
    const contextInfo = this.context.task.context || '';

    return `${this.systemPrompt}

Task: ${taskDescription}

Context: ${contextInfo}

Please provide your response:`;
  }
}

/**
 * Custom agent framework
 */
export class CustomAgentFramework {
  private templates: Map<string, AgentTemplate> = new Map();
  private agents: Map<string, CustomAgentDefinition> = new Map();

  /**
   * Register template
   */
  registerTemplate(template: Omit<AgentTemplate, 'id' | 'createdAt'>): AgentTemplate {
    const fullTemplate: AgentTemplate = {
      ...template,
      id: uuidv4(),
      createdAt: Date.now(),
    };

    this.templates.set(fullTemplate.id, fullTemplate);
    return fullTemplate;
  }

  /**
   * Get template
   */
  getTemplate(id: string): AgentTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): AgentTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): AgentTemplate[] {
    return Array.from(this.templates.values()).filter(
      t => t.category === category
    );
  }

  /**
   * Create agent from template
   */
  createAgentFromTemplate(
    templateId: string,
    customizations?: Partial<CustomAgentDefinition>
  ): CustomAgentDefinition | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const definition: CustomAgentDefinition = {
      name: customizations?.name || template.name,
      description: customizations?.description || template.description,
      systemPrompt: customizations?.systemPrompt || template.prompt,
      tools: customizations?.tools || template.tools,
      config: { ...template.config, ...customizations?.config },
      beforeExecute: customizations?.beforeExecute,
      afterExecute: customizations?.afterExecute,
      onError: customizations?.onError,
    };

    this.agents.set(definition.name, definition);
    return definition;
  }

  /**
   * Register custom agent
   */
  registerAgent(definition: CustomAgentDefinition): void {
    this.agents.set(definition.name, definition);
  }

  /**
   * Get agent
   */
  getAgent(name: string): CustomAgentDefinition | undefined {
    return this.agents.get(name);
  }

  /**
   * Get all agents
   */
  getAllAgents(): CustomAgentDefinition[] {
    return Array.from(this.agents.values());
  }

  /**
   * Create agent instance
   */
  createAgentInstance(name: string, context: AgentContext): CustomAgent | null {
    const definition = this.agents.get(name);
    if (!definition) return null;

    return new CustomAgent(definition, context);
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * Delete agent
   */
  deleteAgent(name: string): boolean {
    return this.agents.delete(name);
  }

  /**
   * Export templates
   */
  exportTemplates(): string {
    return JSON.stringify(Array.from(this.templates.values()), null, 2);
  }

  /**
   * Import templates
   */
  importTemplates(data: string): void {
    try {
      const templates = JSON.parse(data) as AgentTemplate[];

      for (const template of templates) {
        this.templates.set(template.id, template);
      }
    } catch (error) {
      throw new Error(`Failed to import templates: ${error}`);
    }
  }
}

/**
 * Built-in templates
 */
export const BUILTIN_TEMPLATES: Omit<AgentTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Code Reviewer',
    description: 'Reviews code for quality, security, and best practices',
    category: 'code-quality',
    prompt: `You are a code reviewer. Review the provided code for:
- Code quality and readability
- Security vulnerabilities
- Performance issues
- Best practices
- Potential bugs

Provide detailed feedback with specific suggestions.`,
    tools: ['file-read', 'code-analysis'],
    config: {
      temperature: 0.3,
      maxTokens: 2000,
    },
  },
  {
    name: 'Documentation Writer',
    description: 'Generates comprehensive documentation',
    category: 'documentation',
    prompt: `You are a documentation writer. Generate clear, comprehensive documentation for the provided code or feature.

Include:
- Overview and purpose
- Usage examples
- API reference
- Configuration options
- Best practices`,
    tools: ['file-read', 'file-write'],
    config: {
      temperature: 0.7,
      maxTokens: 3000,
    },
  },
  {
    name: 'Bug Fixer',
    description: 'Analyzes and fixes bugs in code',
    category: 'debugging',
    prompt: `You are a bug fixer. Analyze the provided code and error messages to:
- Identify the root cause
- Propose a fix
- Explain the solution
- Suggest preventive measures`,
    tools: ['file-read', 'file-write', 'terminal-execute'],
    config: {
      temperature: 0.5,
      maxTokens: 2000,
    },
  },
  {
    name: 'Test Generator',
    description: 'Generates comprehensive test suites',
    category: 'testing',
    prompt: `You are a test generator. Generate comprehensive test suites for the provided code.

Include:
- Unit tests
- Integration tests
- Edge cases
- Error scenarios
- Test documentation`,
    tools: ['file-read', 'file-write', 'terminal-execute'],
    config: {
      temperature: 0.6,
      maxTokens: 3000,
    },
  },
  {
    name: 'Performance Optimizer',
    description: 'Optimizes code for performance',
    category: 'optimization',
    prompt: `You are a performance optimizer. Analyze the provided code and:
- Identify performance bottlenecks
- Suggest optimizations
- Provide benchmarks
- Explain trade-offs`,
    tools: ['file-read', 'code-analysis', 'terminal-execute'],
    config: {
      temperature: 0.4,
      maxTokens: 2000,
    },
  },
  {
    name: 'Security Auditor',
    description: 'Audits code for security vulnerabilities',
    category: 'security',
    prompt: `You are a security auditor. Audit the provided code for:
- Security vulnerabilities
- Authentication/authorization issues
- Data validation problems
- Injection vulnerabilities
- Sensitive data exposure

Provide detailed findings with severity levels and remediation steps.`,
    tools: ['file-read', 'code-analysis'],
    config: {
      temperature: 0.3,
      maxTokens: 2500,
    },
  },
];

/**
 * Create custom agent framework instance
 */
export function createCustomAgentFramework(): CustomAgentFramework {
  const framework = new CustomAgentFramework();

  // Register built-in templates
  for (const template of BUILTIN_TEMPLATES) {
    framework.registerTemplate(template);
  }

  return framework;
}
