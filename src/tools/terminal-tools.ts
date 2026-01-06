/**
 * Terminal Tools
 * 
 * Implements terminal/shell execution for agents
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Terminal execution result
 */
export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

/**
 * Terminal tools
 */
export class TerminalTools {
  /**
   * Execute command
   */
  static async executeCommand(
    command: string,
    options?: {
      cwd?: string;
      timeout?: number;
      env?: NodeJS.ProcessEnv;
    }
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: options?.cwd,
        timeout: options?.timeout || 30000,
        env: options?.env,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      return {
        stdout,
        stderr,
        exitCode: 0,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || '',
        exitCode: error.code || 1,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run npm script
   */
  static async runNpmScript(
    script: string,
    options?: {
      cwd?: string;
      timeout?: number;
    }
  ): Promise<ExecutionResult> {
    return this.executeCommand(`npm run ${script}`, options);
  }

  /**
   * Run yarn script
   */
  static async runYarnScript(
    script: string,
    options?: {
      cwd?: string;
      timeout?: number;
    }
  ): Promise<ExecutionResult> {
    return this.executeCommand(`yarn ${script}`, options);
  }

  /**
   * Install dependencies
   */
  static async installDependencies(options?: {
    cwd?: string;
    timeout?: number;
    useYarn?: boolean;
  }): Promise<ExecutionResult> {
    const command = options?.useYarn ? 'yarn install' : 'npm install';
    return this.executeCommand(command, {
      cwd: options?.cwd,
      timeout: options?.timeout || 60000,
    });
  }

  /**
   * Run tests
   */
  static async runTests(options?: {
    cwd?: string;
    timeout?: number;
    testCommand?: string;
  }): Promise<ExecutionResult> {
    const command = options?.testCommand || 'npm test';
    return this.executeCommand(command, {
      cwd: options?.cwd,
      timeout: options?.timeout || 60000,
    });
  }

  /**
   * Build project
   */
  static async build(options?: {
    cwd?: string;
    timeout?: number;
    buildCommand?: string;
  }): Promise<ExecutionResult> {
    const command = options?.buildCommand || 'npm run build';
    return this.executeCommand(command, {
      cwd: options?.cwd,
      timeout: options?.timeout || 60000,
    });
  }

  /**
   * Lint code
   */
  static async lint(options?: {
    cwd?: string;
    timeout?: number;
    lintCommand?: string;
  }): Promise<ExecutionResult> {
    const command = options?.lintCommand || 'npm run lint';
    return this.executeCommand(command, {
      cwd: options?.cwd,
      timeout: options?.timeout || 30000,
    });
  }

  /**
   * Format code
   */
  static async format(options?: {
    cwd?: string;
    timeout?: number;
    formatCommand?: string;
  }): Promise<ExecutionResult> {
    const command = options?.formatCommand || 'npm run format';
    return this.executeCommand(command, {
      cwd: options?.cwd,
      timeout: options?.timeout || 30000,
    });
  }

  /**
   * Check if command exists
   */
  static async commandExists(command: string): Promise<boolean> {
    try {
      const checkCommand = process.platform === 'win32' ? `where ${command}` : `which ${command}`;
      const result = await this.executeCommand(checkCommand);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  /**
   * Get Node.js version
   */
  static async getNodeVersion(): Promise<string> {
    const result = await this.executeCommand('node --version');
    return result.stdout.trim();
  }

  /**
   * Get npm version
   */
  static async getNpmVersion(): Promise<string> {
    const result = await this.executeCommand('npm --version');
    return result.stdout.trim();
  }

  /**
   * Get git status
   */
  static async getGitStatus(cwd?: string): Promise<string> {
    const result = await this.executeCommand('git status', { cwd });
    return result.stdout;
  }

  /**
   * Git add files
   */
  static async gitAdd(files: string[], cwd?: string): Promise<ExecutionResult> {
    const fileList = files.join(' ');
    return this.executeCommand(`git add ${fileList}`, { cwd });
  }

  /**
   * Git commit
   */
  static async gitCommit(message: string, cwd?: string): Promise<ExecutionResult> {
    return this.executeCommand(`git commit -m "${message}"`, { cwd });
  }

  /**
   * Git push
   */
  static async gitPush(cwd?: string): Promise<ExecutionResult> {
    return this.executeCommand('git push', { cwd });
  }

  /**
   * Parse execution result
   */
  static parseResult(result: ExecutionResult): {
    success: boolean;
    output: string;
    error?: string;
  } {
    return {
      success: result.exitCode === 0,
      output: result.stdout,
      error: result.stderr || undefined,
    };
  }

  /**
   * Stream command execution
   */
  static streamCommand(
    command: string,
    options?: {
      cwd?: string;
      onData?: (data: string) => void;
      onError?: (error: string) => void;
      onClose?: (code: number) => void;
    }
  ): void {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      cwd: options?.cwd,
      shell: true,
    });

    child.stdout.on('data', (data) => {
      options?.onData?.(data.toString());
    });

    child.stderr.on('data', (data) => {
      options?.onError?.(data.toString());
    });

    child.on('close', (code) => {
      options?.onClose?.(code || 0);
    });
  }
}
