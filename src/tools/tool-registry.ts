/**
 * Tool Registry
 * 
 * Manages available tools for agents
 * Supports: file system, terminal, browser, database operations
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Tool definition
 */
export interface Tool {
  name: string;
  description: string;
  category: 'file' | 'terminal' | 'browser' | 'database' | 'code' | 'other';
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      required: boolean;
      default?: any;
    };
  };
  execute: (params: any) => Promise<any>;
  requiredAgentRoles?: string[];
}

/**
 * Tool call result
 */
export interface ToolCallResult {
  id: string;
  toolName: string;
  status: 'success' | 'error';
  input: any;
  output: any;
  error?: string;
  duration: number;
  timestamp: number;
}

/**
 * Tool Registry
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private callHistory: ToolCallResult[] = [];

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Register a tool
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolName: string): void {
    this.tools.delete(toolName);
  }

  /**
   * Get a tool
   */
  getTool(toolName: string): Tool {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    return tool;
  }

  /**
   * List all tools
   */
  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * List tools by category
   */
  listToolsByCategory(category: string): Tool[] {
    return Array.from(this.tools.values()).filter(t => t.category === category);
  }

  /**
   * List tools available for agent role
   */
  listToolsForRole(role: string): Tool[] {
    return Array.from(this.tools.values()).filter(
      t => !t.requiredAgentRoles || t.requiredAgentRoles.includes(role)
    );
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName: string, params: any): Promise<ToolCallResult> {
    const tool = this.getTool(toolName);
    const startTime = Date.now();
    const resultId = uuidv4();

    try {
      // Validate parameters
      this.validateParameters(tool, params);

      // Execute tool
      const output = await tool.execute(params);

      const result: ToolCallResult = {
        id: resultId,
        toolName,
        status: 'success',
        input: params,
        output,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };

      this.callHistory.push(result);
      return result;
    } catch (error) {
      const result: ToolCallResult = {
        id: resultId,
        toolName,
        status: 'error',
        input: params,
        output: null,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };

      this.callHistory.push(result);
      return result;
    }
  }

  /**
   * Validate tool parameters
   */
  private validateParameters(tool: Tool, params: any): void {
    const paramDefs = tool.parameters;

    for (const [paramName, paramDef] of Object.entries(paramDefs)) {
      const paramDef_ = paramDef as any;
      if (paramDef_.required && !(paramName in params)) {
        throw new Error(`Missing required parameter: ${paramName}`);
      }

      if (paramName in params) {
        const value = params[paramName];
        const expectedType = paramDef_.type;

        if (expectedType === 'string' && typeof value !== 'string') {
          throw new Error(`Parameter ${paramName} must be a string`);
        }
        if (expectedType === 'number' && typeof value !== 'number') {
          throw new Error(`Parameter ${paramName} must be a number`);
        }
        if (expectedType === 'boolean' && typeof value !== 'boolean') {
          throw new Error(`Parameter ${paramName} must be a boolean`);
        }
      }
    }
  }

  /**
   * Get tool call history
   */
  getCallHistory(toolName?: string, limit?: number): ToolCallResult[] {
    let history = this.callHistory;

    if (toolName) {
      history = history.filter(h => h.toolName === toolName);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Clear call history
   */
  clearCallHistory(): void {
    this.callHistory = [];
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalTools: number;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageDuration: number;
    callsByCategory: { [key: string]: number };
  } {
    const successful = this.callHistory.filter(h => h.status === 'success').length;
    const failed = this.callHistory.filter(h => h.status === 'error').length;
    const avgDuration =
      this.callHistory.length > 0
        ? this.callHistory.reduce((sum, h) => sum + h.duration, 0) / this.callHistory.length
        : 0;

    const callsByCategory: { [key: string]: number } = {};
    this.callHistory.forEach(h => {
      const tool = this.tools.get(h.toolName);
      if (tool) {
        callsByCategory[tool.category] = (callsByCategory[tool.category] || 0) + 1;
      }
    });

    return {
      totalTools: this.tools.size,
      totalCalls: this.callHistory.length,
      successfulCalls: successful,
      failedCalls: failed,
      averageDuration: avgDuration,
      callsByCategory,
    };
  }

  /**
   * Register default tools (stubs - to be implemented)
   */
  private registerDefaultTools(): void {
    // File system tools
    this.registerTool({
      name: 'read_file',
      description: 'Read the contents of a file',
      category: 'file',
      parameters: {
        path: {
          type: 'string',
          description: 'Path to the file',
          required: true,
        },
      },
      execute: async (params) => {
        // Implementation will be added
        throw new Error('read_file not implemented');
      },
    });

    this.registerTool({
      name: 'write_file',
      description: 'Write contents to a file',
      category: 'file',
      parameters: {
        path: {
          type: 'string',
          description: 'Path to the file',
          required: true,
        },
        content: {
          type: 'string',
          description: 'File contents',
          required: true,
        },
      },
      execute: async (params) => {
        // Implementation will be added
        throw new Error('write_file not implemented');
      },
    });

    this.registerTool({
      name: 'list_files',
      description: 'List files in a directory',
      category: 'file',
      parameters: {
        path: {
          type: 'string',
          description: 'Directory path',
          required: true,
        },
      },
      execute: async (params) => {
        // Implementation will be added
        throw new Error('list_files not implemented');
      },
    });

    // Terminal tools
    this.registerTool({
      name: 'execute_command',
      description: 'Execute a shell command',
      category: 'terminal',
      parameters: {
        command: {
          type: 'string',
          description: 'Command to execute',
          required: true,
        },
        cwd: {
          type: 'string',
          description: 'Working directory',
          required: false,
        },
      },
      execute: async (params) => {
        // Implementation will be added
        throw new Error('execute_command not implemented');
      },
      requiredAgentRoles: ['coder', 'tester'],
    });

    this.registerTool({
      name: 'run_tests',
      description: 'Run test suite',
      category: 'terminal',
      parameters: {
        testCommand: {
          type: 'string',
          description: 'Test command to run',
          required: true,
        },
      },
      execute: async (params) => {
        // Implementation will be added
        throw new Error('run_tests not implemented');
      },
      requiredAgentRoles: ['tester'],
    });

    // Browser tools
    this.registerTool({
      name: 'navigate_url',
      description: 'Navigate to a URL in the browser',
      category: 'browser',
      parameters: {
        url: {
          type: 'string',
          description: 'URL to navigate to',
          required: true,
        },
      },
      execute: async (params) => {
        // Implementation will be added
        throw new Error('navigate_url not implemented');
      },
      requiredAgentRoles: ['tester'],
    });

    this.registerTool({
      name: 'take_screenshot',
      description: 'Take a screenshot of the current browser view',
      category: 'browser',
      parameters: {},
      execute: async (params) => {
        // Implementation will be added
        throw new Error('take_screenshot not implemented');
      },
      requiredAgentRoles: ['tester'],
    });

    this.registerTool({
      name: 'click_element',
      description: 'Click an element on the page',
      category: 'browser',
      parameters: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element',
          required: true,
        },
      },
      execute: async (params) => {
        // Implementation will be added
        throw new Error('click_element not implemented');
      },
      requiredAgentRoles: ['tester'],
    });

    // Code analysis tools
    this.registerTool({
      name: 'analyze_code',
      description: 'Analyze code for patterns and issues',
      category: 'code',
      parameters: {
        filePath: {
          type: 'string',
          description: 'Path to code file',
          required: true,
        },
      },
      execute: async (params) => {
        // Implementation will be added
        throw new Error('analyze_code not implemented');
      },
    });

    this.registerTool({
      name: 'search_codebase',
      description: 'Search the codebase for patterns',
      category: 'code',
      parameters: {
        pattern: {
          type: 'string',
          description: 'Search pattern',
          required: true,
        },
      },
      execute: async (params) => {
        // Implementation will be added
        throw new Error('search_codebase not implemented');
      },
    });
  }
}

/**
 * Create a tool registry instance
 */
export function createToolRegistry(): ToolRegistry {
  return new ToolRegistry();
}
