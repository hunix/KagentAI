/**
 * Prompt Manager
 * 
 * Manages prompts for different agents and tasks
 * Supports structured prompts with input/output schemas
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Prompt template
 */
export interface PromptTemplate {
  id: string;
  name: string;
  role: string;
  description: string;
  template: string;
  inputSchema: {
    [key: string]: {
      type: string;
      description: string;
      required: boolean;
    };
  };
  outputSchema: {
    type: string;
    description: string;
  };
  examples?: Array<{
    input: any;
    output: any;
  }>;
  tags: string[];
  version: number;
}

/**
 * Prompt Manager
 */
export class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map();
  private history: Array<{ templateId: string; timestamp: number; input: any; output: any }> = [];

  constructor() {
    this.registerDefaultPrompts();
  }

  /**
   * Register a prompt template
   */
  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a prompt template
   */
  getTemplate(templateId: string): PromptTemplate {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Prompt template not found: ${templateId}`);
    }
    return template;
  }

  /**
   * Get template by name
   */
  getTemplateByName(name: string): PromptTemplate {
    const template = Array.from(this.templates.values()).find(t => t.name === name);
    if (!template) {
      throw new Error(`Prompt template not found: ${name}`);
    }
    return template;
  }

  /**
   * List all templates
   */
  listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * List templates by role
   */
  listTemplatesByRole(role: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.role === role);
  }

  /**
   * Render a prompt with variables
   */
  renderPrompt(templateId: string, variables: any): string {
    const template = this.getTemplate(templateId);
    let prompt = template.template;

    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      prompt = prompt.replace(regex, String(value));
    }

    return prompt;
  }

  /**
   * Validate input against schema
   */
  validateInput(templateId: string, input: any): { valid: boolean; errors: string[] } {
    const template = this.getTemplate(templateId);
    const errors: string[] = [];

    for (const [key, schema] of Object.entries(template.inputSchema)) {
      const schemaTyped = schema as any;
      if (schemaTyped.required && !(key in input)) {
        errors.push(`Missing required input: ${key}`);
      }

      if (key in input) {
        const value = input[key];
        if (schemaTyped.type === 'string' && typeof value !== 'string') {
          errors.push(`Input ${key} must be a string`);
        }
        if (schemaTyped.type === 'number' && typeof value !== 'number') {
          errors.push(`Input ${key} must be a number`);
        }
        if (schemaTyped.type === 'array' && !Array.isArray(value)) {
          errors.push(`Input ${key} must be an array`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate output against schema
   */
  validateOutput(templateId: string, output: any): { valid: boolean; errors: string[] } {
    const template = this.getTemplate(templateId);
    const errors: string[] = [];

    if (template.outputSchema.type === 'string' && typeof output !== 'string') {
      errors.push('Output must be a string');
    }
    if (template.outputSchema.type === 'object' && typeof output !== 'object') {
      errors.push('Output must be an object');
    }
    if (template.outputSchema.type === 'array' && !Array.isArray(output)) {
      errors.push('Output must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Record prompt execution
   */
  recordExecution(templateId: string, input: any, output: any): void {
    this.history.push({
      templateId,
      timestamp: Date.now(),
      input,
      output,
    });
  }

  /**
   * Get execution history
   */
  getExecutionHistory(templateId?: string, limit?: number): Array<any> {
    let history = this.history;

    if (templateId) {
      history = history.filter(h => h.templateId === templateId);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Get template statistics
   */
  getTemplateStats(templateId: string): {
    usageCount: number;
    lastUsed?: number;
    successRate: number;
  } {
    const executions = this.history.filter(h => h.templateId === templateId);

    return {
      usageCount: executions.length,
      lastUsed: executions.length > 0 ? executions[executions.length - 1].timestamp : undefined,
      successRate: executions.length > 0 ? 1 : 0, // Simplified - would need error tracking
    };
  }

  /**
   * Register default prompts
   */
  private registerDefaultPrompts(): void {
    // Planner prompt
    this.registerTemplate({
      id: 'planner-task-breakdown',
      name: 'Planner: Task Breakdown',
      role: 'planner',
      description: 'Break down a user request into a high-level task plan',
      template: `You are an expert software architect. Your task is to create a comprehensive plan for the following user request:

User Request: {{ userRequest }}

Project Context:
- Tech Stack: {{ techStack }}
- Current Structure: {{ projectStructure }}
- Existing Patterns: {{ existingPatterns }}

Create a detailed plan that includes:
1. Clear goals for what needs to be accomplished
2. High-level approach to solving the problem
3. Major steps required (5-10 steps)
4. Estimated time for each step
5. Any dependencies or risks

Format your response as a structured plan.`,
      inputSchema: {
        userRequest: {
          type: 'string',
          description: 'The user request or task description',
          required: true,
        },
        techStack: {
          type: 'array',
          description: 'Technologies used in the project',
          required: true,
        },
        projectStructure: {
          type: 'string',
          description: 'Current project structure',
          required: false,
        },
        existingPatterns: {
          type: 'array',
          description: 'Existing code patterns',
          required: false,
        },
      },
      outputSchema: {
        type: 'object',
        description: 'Task plan with goals, approach, and steps',
      },
      tags: ['planner', 'planning', 'task-breakdown'],
      version: 1,
    });

    // Architect prompt
    this.registerTemplate({
      id: 'architect-implementation-plan',
      name: 'Architect: Implementation Plan',
      role: 'architect',
      description: 'Create a detailed implementation plan from a task plan',
      template: `You are an expert software architect. Based on the following task plan, create a detailed implementation plan:

Task Plan: {{ taskPlan }}

Project Context:
- Tech Stack: {{ techStack }}
- Current Structure: {{ projectStructure }}

Create an implementation plan that includes:
1. Specific files to create or modify
2. Step-by-step implementation instructions
3. Code dependencies and relationships
4. Testing strategy
5. Deployment considerations

Format your response as a structured implementation plan.`,
      inputSchema: {
        taskPlan: {
          type: 'object',
          description: 'The task plan from the planner',
          required: true,
        },
        techStack: {
          type: 'array',
          description: 'Technologies used in the project',
          required: true,
        },
        projectStructure: {
          type: 'string',
          description: 'Current project structure',
          required: false,
        },
      },
      outputSchema: {
        type: 'object',
        description: 'Implementation plan with file requirements and steps',
      },
      tags: ['architect', 'planning', 'implementation'],
      version: 1,
    });

    // Coder prompt
    this.registerTemplate({
      id: 'coder-generate-code',
      name: 'Coder: Generate Code',
      role: 'coder',
      description: 'Generate code for a specific implementation step',
      template: `You are an expert software developer. Generate code for the following task:

Task: {{ task }}
File: {{ filePath }}
Language: {{ language }}

Requirements:
- Follow the existing code style and patterns
- Include proper error handling
- Add comments for complex logic
- Ensure the code is production-ready

Context:
{{ context }}

Generate the complete code for this file.`,
      inputSchema: {
        task: {
          type: 'string',
          description: 'The specific task or requirement',
          required: true,
        },
        filePath: {
          type: 'string',
          description: 'Path to the file to generate',
          required: true,
        },
        language: {
          type: 'string',
          description: 'Programming language',
          required: true,
        },
        context: {
          type: 'string',
          description: 'Additional context about the project',
          required: false,
        },
      },
      outputSchema: {
        type: 'string',
        description: 'Generated code',
      },
      tags: ['coder', 'code-generation'],
      version: 1,
    });

    // Tester prompt
    this.registerTemplate({
      id: 'tester-verify-implementation',
      name: 'Tester: Verify Implementation',
      role: 'tester',
      description: 'Verify that the implementation meets requirements',
      template: `You are a QA engineer. Verify that the following implementation meets the requirements:

Requirements:
{{ requirements }}

Implementation:
{{ implementation }}

Create a verification plan that includes:
1. Test cases to run
2. Expected results
3. Edge cases to check
4. Performance considerations

Format your response as a structured verification plan.`,
      inputSchema: {
        requirements: {
          type: 'string',
          description: 'The requirements to verify against',
          required: true,
        },
        implementation: {
          type: 'string',
          description: 'The implementation to verify',
          required: true,
        },
      },
      outputSchema: {
        type: 'object',
        description: 'Verification plan with test cases',
      },
      tags: ['tester', 'testing', 'verification'],
      version: 1,
    });

    // Reviewer prompt
    this.registerTemplate({
      id: 'reviewer-code-review',
      name: 'Reviewer: Code Review',
      role: 'reviewer',
      description: 'Review code for quality and best practices',
      template: `You are a senior code reviewer. Review the following code changes:

Changes:
{{ changes }}

Review Criteria:
- Code quality and readability
- Performance implications
- Security considerations
- Test coverage
- Documentation

Provide a detailed review with:
1. Issues found (if any)
2. Suggestions for improvement
3. Overall assessment
4. Approval status

Format your response as a structured code review.`,
      inputSchema: {
        changes: {
          type: 'string',
          description: 'The code changes to review',
          required: true,
        },
      },
      outputSchema: {
        type: 'object',
        description: 'Code review with findings and suggestions',
      },
      tags: ['reviewer', 'code-review', 'quality-assurance'],
      version: 1,
    });
  }
}

/**
 * Create a prompt manager instance
 */
export function createPromptManager(): PromptManager {
  return new PromptManager();
}
