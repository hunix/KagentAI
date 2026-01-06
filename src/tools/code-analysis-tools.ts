/**
 * Code Analysis Tools
 * 
 * Implements code analysis for agents
 */

import { FileSystemTools } from './file-system-tools';

/**
 * Code metrics
 */
export interface CodeMetrics {
  lines: number;
  functions: number;
  classes: number;
  comments: number;
  complexity: number;
}

/**
 * Code issue
 */
export interface CodeIssue {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
}

/**
 * Code analysis tools
 */
export class CodeAnalysisTools {
  /**
   * Analyze code metrics
   */
  static async analyzeMetrics(filePath: string): Promise<CodeMetrics> {
    try {
      const content = await FileSystemTools.readFile(filePath);
      const lines = content.split('\n');

      // Count lines
      const totalLines = lines.length;
      const commentLines = lines.filter(line => line.trim().startsWith('//')).length;

      // Count functions
      const functionPattern = /function\s+\w+|const\s+\w+\s*=\s*\(|async\s+\w+/g;
      const functions = (content.match(functionPattern) || []).length;

      // Count classes
      const classPattern = /class\s+\w+/g;
      const classes = (content.match(classPattern) || []).length;

      // Estimate complexity
      const ifPattern = /if\s*\(/g;
      const forPattern = /for\s*\(/g;
      const whilePattern = /while\s*\(/g;
      const casePattern = /case\s+/g;

      const complexity =
        (content.match(ifPattern) || []).length +
        (content.match(forPattern) || []).length +
        (content.match(whilePattern) || []).length +
        (content.match(casePattern) || []).length;

      return {
        lines: totalLines,
        functions,
        classes,
        comments: commentLines,
        complexity,
      };
    } catch (error) {
      throw new Error(`Failed to analyze metrics for ${filePath}: ${error}`);
    }
  }

  /**
   * Check code quality
   */
  static async checkQuality(filePath: string): Promise<CodeIssue[]> {
    try {
      const content = await FileSystemTools.readFile(filePath);
      const lines = content.split('\n');
      const issues: CodeIssue[] = [];

      // Check for common issues
      lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Check for console.log
        if (line.includes('console.log')) {
          issues.push({
            line: lineNum,
            column: line.indexOf('console.log'),
            severity: 'warning',
            message: 'Remove console.log in production code',
            rule: 'no-console',
          });
        }

        // Check for TODO/FIXME
        if (line.includes('TODO') || line.includes('FIXME')) {
          issues.push({
            line: lineNum,
            column: line.indexOf('TODO') || line.indexOf('FIXME'),
            severity: 'info',
            message: 'Unresolved TODO/FIXME comment',
            rule: 'no-todo',
          });
        }

        // Check for var usage
        if (/^\s*var\s+/.test(line)) {
          issues.push({
            line: lineNum,
            column: line.indexOf('var'),
            severity: 'warning',
            message: 'Use const or let instead of var',
            rule: 'no-var',
          });
        }

        // Check for long lines
        if (line.length > 120) {
          issues.push({
            line: lineNum,
            column: 120,
            severity: 'info',
            message: 'Line exceeds 120 characters',
            rule: 'max-line-length',
          });
        }

        // Check for missing semicolons (basic check)
        if (
          line.trim() &&
          !line.trim().endsWith(';') &&
          !line.trim().endsWith('{') &&
          !line.trim().endsWith('}') &&
          !line.trim().endsWith(',') &&
          !line.trim().endsWith(':')
        ) {
          // Skip comments and strings
          if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            // This is a very basic check
          }
        }
      });

      return issues;
    } catch (error) {
      throw new Error(`Failed to check quality for ${filePath}: ${error}`);
    }
  }

  /**
   * Find patterns in code
   */
  static async findPatterns(
    filePath: string,
    pattern: RegExp
  ): Promise<Array<{ line: number; match: string }>> {
    try {
      const content = await FileSystemTools.readFile(filePath);
      const lines = content.split('\n');
      const matches: Array<{ line: number; match: string }> = [];

      lines.forEach((line, index) => {
        const match = line.match(pattern);
        if (match) {
          matches.push({
            line: index + 1,
            match: match[0],
          });
        }
      });

      return matches;
    } catch (error) {
      throw new Error(`Failed to find patterns in ${filePath}: ${error}`);
    }
  }

  /**
   * Extract imports
   */
  static async extractImports(filePath: string): Promise<string[]> {
    try {
      const content = await FileSystemTools.readFile(filePath);

      // TypeScript/JavaScript imports
      const tsImports = content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g) || [];
      const tsRequires = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];

      // Python imports
      const pyImports = content.match(/from\s+(\S+)\s+import|import\s+(\S+)/g) || [];

      const allImports = [...tsImports, ...tsRequires, ...pyImports];

      return allImports.map(imp => imp.trim());
    } catch (error) {
      throw new Error(`Failed to extract imports from ${filePath}: ${error}`);
    }
  }

  /**
   * Extract functions
   */
  static async extractFunctions(filePath: string): Promise<Array<{ name: string; line: number }>> {
    try {
      const content = await FileSystemTools.readFile(filePath);
      const lines = content.split('\n');
      const functions: Array<{ name: string; line: number }> = [];

      lines.forEach((line, index) => {
        // Match function declarations
        const funcMatch = line.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*\(|async\s+(\w+)/);
        if (funcMatch) {
          const name = funcMatch[1] || funcMatch[2] || funcMatch[3];
          functions.push({
            name,
            line: index + 1,
          });
        }
      });

      return functions;
    } catch (error) {
      throw new Error(`Failed to extract functions from ${filePath}: ${error}`);
    }
  }

  /**
   * Extract classes
   */
  static async extractClasses(filePath: string): Promise<Array<{ name: string; line: number }>> {
    try {
      const content = await FileSystemTools.readFile(filePath);
      const lines = content.split('\n');
      const classes: Array<{ name: string; line: number }> = [];

      lines.forEach((line, index) => {
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch) {
          classes.push({
            name: classMatch[1],
            line: index + 1,
          });
        }
      });

      return classes;
    } catch (error) {
      throw new Error(`Failed to extract classes from ${filePath}: ${error}`);
    }
  }

  /**
   * Get code summary
   */
  static async getSummary(filePath: string): Promise<string> {
    try {
      const metrics = await this.analyzeMetrics(filePath);
      const issues = await this.checkQuality(filePath);
      const functions = await this.extractFunctions(filePath);
      const classes = await this.extractClasses(filePath);

      let summary = `# Code Summary: ${filePath}\n\n`;
      summary += `## Metrics\n`;
      summary += `- Lines: ${metrics.lines}\n`;
      summary += `- Functions: ${metrics.functions}\n`;
      summary += `- Classes: ${metrics.classes}\n`;
      summary += `- Comments: ${metrics.comments}\n`;
      summary += `- Complexity: ${metrics.complexity}\n\n`;

      if (functions.length > 0) {
        summary += `## Functions\n`;
        functions.forEach(func => {
          summary += `- ${func.name} (line ${func.line})\n`;
        });
        summary += '\n';
      }

      if (classes.length > 0) {
        summary += `## Classes\n`;
        classes.forEach(cls => {
          summary += `- ${cls.name} (line ${cls.line})\n`;
        });
        summary += '\n';
      }

      if (issues.length > 0) {
        summary += `## Issues (${issues.length})\n`;
        issues.slice(0, 10).forEach(issue => {
          summary += `- Line ${issue.line}: [${issue.severity}] ${issue.message}\n`;
        });
        if (issues.length > 10) {
          summary += `- ... and ${issues.length - 10} more issues\n`;
        }
      }

      return summary;
    } catch (error) {
      throw new Error(`Failed to get summary for ${filePath}: ${error}`);
    }
  }

  /**
   * Estimate code quality score (0-100)
   */
  static async getQualityScore(filePath: string): Promise<number> {
    try {
      const metrics = await this.analyzeMetrics(filePath);
      const issues = await this.checkQuality(filePath);

      let score = 100;

      // Deduct for complexity
      if (metrics.complexity > 10) {
        score -= Math.min(20, (metrics.complexity - 10) * 2);
      }

      // Deduct for issues
      const errorCount = issues.filter(i => i.severity === 'error').length;
      const warningCount = issues.filter(i => i.severity === 'warning').length;

      score -= errorCount * 10;
      score -= warningCount * 2;

      // Bonus for comments
      const commentRatio = metrics.comments / metrics.lines;
      if (commentRatio > 0.1) {
        score += 5;
      }

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      throw new Error(`Failed to get quality score for ${filePath}: ${error}`);
    }
  }
}
