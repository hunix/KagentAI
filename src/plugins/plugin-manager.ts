/**
 * Plugin Manager
 * 
 * Extensibility framework for custom plugins
 */

import { EventEmitter } from 'events';

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  license?: string;
  dependencies?: string[];
}

/**
 * Plugin interface
 */
export interface Plugin {
  metadata: PluginMetadata;
  activate(context: PluginContext): Promise<void>;
  deactivate(): Promise<void>;
}

/**
 * Plugin context
 */
export interface PluginContext {
  registerCommand(name: string, handler: (...args: any[]) => any): void;
  registerTool(name: string, tool: any): void;
  registerAgent(name: string, agent: any): void;
  getConfig(key: string): any;
  setConfig(key: string, value: any): void;
  log(message: string): void;
}

/**
 * Plugin manager
 */
export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private activePlugins: Set<string> = new Set();
  private commands: Map<string, (...args: any[]) => any> = new Map();
  private tools: Map<string, any> = new Map();
  private agents: Map<string, any> = new Map();
  private config: Map<string, any> = new Map();

  /**
   * Register plugin
   */
  async registerPlugin(plugin: Plugin): Promise<boolean> {
    try {
      // Check dependencies
      if (plugin.metadata.dependencies) {
        for (const dep of plugin.metadata.dependencies) {
          if (!this.activePlugins.has(dep)) {
            throw new Error(`Missing dependency: ${dep}`);
          }
        }
      }

      this.plugins.set(plugin.metadata.id, plugin);
      this.emit('plugin:registered', plugin.metadata);

      return true;
    } catch (error) {
      this.emit('plugin:error', { plugin: plugin.metadata.id, error });
      return false;
    }
  }

  /**
   * Activate plugin
   */
  async activatePlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin not found: ${pluginId}`);
      }

      if (this.activePlugins.has(pluginId)) {
        return true; // Already active
      }

      const context = this.createPluginContext(pluginId);
      await plugin.activate(context);

      this.activePlugins.add(pluginId);
      this.emit('plugin:activated', pluginId);

      return true;
    } catch (error) {
      this.emit('plugin:error', { plugin: pluginId, error });
      return false;
    }
  }

  /**
   * Deactivate plugin
   */
  async deactivatePlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin not found: ${pluginId}`);
      }

      if (!this.activePlugins.has(pluginId)) {
        return true; // Already inactive
      }

      await plugin.deactivate();

      this.activePlugins.delete(pluginId);
      this.emit('plugin:deactivated', pluginId);

      return true;
    } catch (error) {
      this.emit('plugin:error', { plugin: pluginId, error });
      return false;
    }
  }

  /**
   * Unregister plugin
   */
  async unregisterPlugin(pluginId: string): Promise<boolean> {
    try {
      if (this.activePlugins.has(pluginId)) {
        await this.deactivatePlugin(pluginId);
      }

      this.plugins.delete(pluginId);
      this.emit('plugin:unregistered', pluginId);

      return true;
    } catch (error) {
      this.emit('plugin:error', { plugin: pluginId, error });
      return false;
    }
  }

  /**
   * Get plugin
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get active plugins
   */
  getActivePlugins(): Plugin[] {
    return Array.from(this.activePlugins)
      .map(id => this.plugins.get(id))
      .filter((p): p is Plugin => p !== undefined);
  }

  /**
   * Execute command
   */
  async executeCommand(name: string, ...args: any[]): Promise<any> {
    const handler = this.commands.get(name);
    if (!handler) {
      throw new Error(`Command not found: ${name}`);
    }

    return await handler(...args);
  }

  /**
   * Get tool
   */
  getTool(name: string): any {
    return this.tools.get(name);
  }

  /**
   * Get agent
   */
  getAgent(name: string): any {
    return this.agents.get(name);
  }

  /**
   * Create plugin context
   */
  private createPluginContext(pluginId: string): PluginContext {
    return {
      registerCommand: (name: string, handler: (...args: any[]) => any) => {
        this.commands.set(`${pluginId}:${name}`, handler);
        this.emit('command:registered', { plugin: pluginId, command: name });
      },

      registerTool: (name: string, tool: any) => {
        this.tools.set(`${pluginId}:${name}`, tool);
        this.emit('tool:registered', { plugin: pluginId, tool: name });
      },

      registerAgent: (name: string, agent: any) => {
        this.agents.set(`${pluginId}:${name}`, agent);
        this.emit('agent:registered', { plugin: pluginId, agent: name });
      },

      getConfig: (key: string) => {
        return this.config.get(`${pluginId}:${key}`);
      },

      setConfig: (key: string, value: any) => {
        this.config.set(`${pluginId}:${key}`, value);
      },

      log: (message: string) => {
        this.emit('plugin:log', { plugin: pluginId, message });
      },
    };
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalPlugins: number;
    activePlugins: number;
    totalCommands: number;
    totalTools: number;
    totalAgents: number;
  } {
    return {
      totalPlugins: this.plugins.size,
      activePlugins: this.activePlugins.size,
      totalCommands: this.commands.size,
      totalTools: this.tools.size,
      totalAgents: this.agents.size,
    };
  }
}

/**
 * Create plugin manager instance
 */
export function createPluginManager(): PluginManager {
  return new PluginManager();
}

/**
 * Example plugin
 */
export class ExamplePlugin implements Plugin {
  metadata: PluginMetadata = {
    id: 'example-plugin',
    name: 'Example Plugin',
    version: '1.0.0',
    description: 'An example plugin',
    author: 'KagentAI',
    license: 'MIT',
  };

  async activate(context: PluginContext): Promise<void> {
    context.log('Example plugin activated');

    context.registerCommand('hello', () => {
      return 'Hello from example plugin!';
    });

    context.registerTool('exampleTool', {
      execute: () => 'Example tool executed',
    });
  }

  async deactivate(): Promise<void> {
    // Cleanup
  }
}
