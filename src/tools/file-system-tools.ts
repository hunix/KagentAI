/**
 * File System Tools
 * 
 * Implements file system operations for agents
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

/**
 * File system tools
 */
export class FileSystemTools {
  /**
   * Read file contents
   */
  static async readFile(filePath: string): Promise<string> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * Write file contents
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  /**
   * Append to file
   */
  static async appendFile(filePath: string, content: string): Promise<void> {
    try {
      const existing = fs.existsSync(filePath) ? await this.readFile(filePath) : '';
      await this.writeFile(filePath, existing + content);
    } catch (error) {
      throw new Error(`Failed to append to file ${filePath}: ${error}`);
    }
  }

  /**
   * List directory contents
   */
  static async listFiles(dirPath: string, recursive: boolean = false): Promise<string[]> {
    try {
      const files: string[] = [];

      const listDir = async (dir: string, prefix: string = '') => {
        const entries = await readdir(dir);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stats = await stat(fullPath);
          const relativePath = prefix ? `${prefix}/${entry}` : entry;

          if (stats.isFile()) {
            files.push(relativePath);
          } else if (stats.isDirectory() && recursive) {
            await listDir(fullPath, relativePath);
          }
        }
      };

      await listDir(dirPath);
      return files;
    } catch (error) {
      throw new Error(`Failed to list files in ${dirPath}: ${error}`);
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    return fs.existsSync(filePath);
  }

  /**
   * Delete file
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error}`);
    }
  }

  /**
   * Create directory
   */
  static async createDirectory(dirPath: string): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Get file stats
   */
  static async getFileStats(filePath: string): Promise<{
    size: number;
    created: number;
    modified: number;
    isFile: boolean;
    isDirectory: boolean;
  }> {
    try {
      const stats = await stat(filePath);

      return {
        size: stats.size,
        created: stats.birthtime.getTime(),
        modified: stats.mtime.getTime(),
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      throw new Error(`Failed to get stats for ${filePath}: ${error}`);
    }
  }

  /**
   * Search for files matching pattern
   */
  static async searchFiles(
    dirPath: string,
    pattern: RegExp,
    recursive: boolean = true
  ): Promise<string[]> {
    try {
      const files = await this.listFiles(dirPath, recursive);
      return files.filter(file => pattern.test(file));
    } catch (error) {
      throw new Error(`Failed to search files in ${dirPath}: ${error}`);
    }
  }

  /**
   * Search file contents
   */
  static async searchFileContents(
    dirPath: string,
    pattern: RegExp,
    recursive: boolean = true
  ): Promise<Array<{ file: string; matches: string[] }>> {
    try {
      const files = await this.listFiles(dirPath, recursive);
      const results: Array<{ file: string; matches: string[] }> = [];

      for (const file of files) {
        const fullPath = path.join(dirPath, file);

        // Skip binary files
        if (this.isBinaryFile(file)) {
          continue;
        }

        try {
          const content = await this.readFile(fullPath);
          const matches = content.match(pattern);

          if (matches) {
            results.push({ file, matches });
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to search file contents in ${dirPath}: ${error}`);
    }
  }

  /**
   * Check if file is binary
   */
  private static isBinaryFile(filePath: string): boolean {
    const binaryExtensions = [
      '.bin',
      '.exe',
      '.dll',
      '.so',
      '.dylib',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.pdf',
      '.zip',
      '.tar',
      '.gz',
      '.mp3',
      '.mp4',
      '.mov',
    ];

    const ext = path.extname(filePath).toLowerCase();
    return binaryExtensions.includes(ext);
  }

  /**
   * Copy file
   */
  static async copyFile(source: string, destination: string): Promise<void> {
    try {
      const content = await this.readFile(source);
      await this.writeFile(destination, content);
    } catch (error) {
      throw new Error(`Failed to copy file from ${source} to ${destination}: ${error}`);
    }
  }

  /**
   * Move file
   */
  static async moveFile(source: string, destination: string): Promise<void> {
    try {
      await this.copyFile(source, destination);
      await this.deleteFile(source);
    } catch (error) {
      throw new Error(`Failed to move file from ${source} to ${destination}: ${error}`);
    }
  }

  /**
   * Get file type
   */
  static getFileType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    const typeMap: { [key: string]: string } = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.sh': 'bash',
      '.bash': 'bash',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.xml': 'xml',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sql': 'sql',
      '.md': 'markdown',
    };

    return typeMap[ext] || 'text';
  }
}
