/**
 * CLI Interface
 * 
 * Command-line interface for Agentic IDE
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * CLI command
 */
export interface CliCommand {
  name: string;
  description: string;
  args?: Array<{ name: string; description: string; required?: boolean }>;
  options?: Array<{ name: string; description: string; shorthand?: string; default?: string }>;
  handler: (args: any, options: any) => Promise<void>;
}

/**
 * CLI
 */
export class CLI {
  private commands: Map<string, CliCommand> = new Map();
  private version = '1.0.0';
  private name = 'agentic-ide';

  constructor() {
    this.setupDefaultCommands();
  }

  /**
   * Setup default commands
   */
  private setupDefaultCommands(): void {
    // Help command
    this.registerCommand({
      name: 'help',
      description: 'Show help information',
      handler: async () => {
        console.log(`${this.name} v${this.version}`);
        console.log('\nAvailable commands:');

        for (const [name, cmd] of this.commands.entries()) {
          console.log(`  ${name.padEnd(20)} ${cmd.description}`);
        }
      },
    });

    // Version command
    this.registerCommand({
      name: 'version',
      description: 'Show version information',
      handler: async () => {
        console.log(`${this.name} v${this.version}`);
      },
    });

    // Config command
    this.registerCommand({
      name: 'config',
      description: 'Manage configuration',
      args: [{ name: 'action', description: 'get, set, list' }],
      options: [
        { name: 'key', description: 'Configuration key', shorthand: 'k' },
        { name: 'value', description: 'Configuration value', shorthand: 'v' },
      ],
      handler: async (args, options) => {
        console.log('Configuration management');
      },
    });

    // Task command
    this.registerCommand({
      name: 'task',
      description: 'Manage tasks',
      args: [{ name: 'action', description: 'create, list, status, cancel' }],
      options: [
        { name: 'title', description: 'Task title', shorthand: 't' },
        { name: 'description', description: 'Task description', shorthand: 'd' },
      ],
      handler: async (args, options) => {
        console.log('Task management');
      },
    });

    // Server command
    this.registerCommand({
      name: 'server',
      description: 'Manage API server',
      args: [{ name: 'action', description: 'start, stop, status' }],
      options: [
        { name: 'port', description: 'Server port', shorthand: 'p', default: '3000' },
      ],
      handler: async (args, options) => {
        console.log(`Server ${args.action} on port ${options.port}`);
      },
    });

    // Debug command
    this.registerCommand({
      name: 'debug',
      description: 'Debug information',
      options: [
        { name: 'verbose', description: 'Verbose output', shorthand: 'v' },
      ],
      handler: async (args, options) => {
        console.log('Debug information');
      },
    });
  }

  /**
   * Register command
   */
  registerCommand(command: CliCommand): void {
    this.commands.set(command.name, command);
  }

  /**
   * Parse arguments
   */
  parseArgs(argv: string[]): { command: string; args: any; options: any } {
    const [, , ...rest] = argv;

    const command = rest[0] || 'help';
    const args: any = {};
    const options: any = {};

    let i = 1;

    while (i < rest.length) {
      const arg = rest[i];

      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        options[key] = value || true;
      } else if (arg.startsWith('-')) {
        const key = arg.substring(1);
        options[key] = rest[i + 1] || true;
        i++;
      } else {
        args[`arg${Object.keys(args).length}`] = arg;
      }

      i++;
    }

    return { command, args, options };
  }

  /**
   * Execute command
   */
  async execute(argv: string[]): Promise<void> {
    const { command, args, options } = this.parseArgs(argv);

    const cmd = this.commands.get(command);

    if (!cmd) {
      console.error(`Unknown command: ${command}`);
      console.log('Run "agentic-ide help" for available commands');
      return;
    }

    try {
      await cmd.handler(args, options);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get command
   */
  getCommand(name: string): CliCommand | undefined {
    return this.commands.get(name);
  }

  /**
   * Get all commands
   */
  getAllCommands(): CliCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Print help for command
   */
  printCommandHelp(commandName: string): void {
    const cmd = this.commands.get(commandName);

    if (!cmd) {
      console.error(`Unknown command: ${commandName}`);
      return;
    }

    console.log(`\n${cmd.name} - ${cmd.description}`);

    if (cmd.args && cmd.args.length > 0) {
      console.log('\nArguments:');
      for (const arg of cmd.args) {
        console.log(`  ${arg.name.padEnd(15)} ${arg.description}`);
      }
    }

    if (cmd.options && cmd.options.length > 0) {
      console.log('\nOptions:');
      for (const opt of cmd.options) {
        const shorthand = opt.shorthand ? `-${opt.shorthand}, ` : '';
        console.log(`  ${shorthand}--${opt.name.padEnd(15)} ${opt.description}`);
      }
    }
  }
}

/**
 * Create CLI instance
 */
export function createCLI(): CLI {
  return new CLI();
}

/**
 * Run CLI
 */
export async function runCLI(argv: string[] = process.argv): Promise<void> {
  const cli = new CLI();
  await cli.execute(argv);
}
