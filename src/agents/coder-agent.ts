/**
 * Coder Agent
 * 
 * Responsible for generating code based on implementation plans
 * Creates actual code files and patches
 */

import { BaseAgent } from './base-agent';
import { CodePatch } from './agent-types';
import { ArtifactGenerator } from '../artifacts/artifact-generator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Coder Agent
 */
export class CoderAgent extends BaseAgent {
  /**
   * Execute coder agent
   * 
   * Generates code for each file in the implementation plan
   */
  async execute(): Promise<void> {
    try {
      this.updateStatus('executing', 10);
      this.addReasoningStep('Starting code generation phase');

      const taskContext = this.getTaskContext();

      // Verify implementation plan exists
      if (!taskContext.implementationPlan) {
        throw new Error('Implementation plan not found. Architect agent must execute first.');
      }

      this.addReasoningStep('Retrieved implementation plan');
      this.updateStatus('executing', 20);

      const implementationPlan = taskContext.implementationPlan;
      const codePatches: CodePatch[] = [];

      // Generate code for each file
      const fileCount = implementationPlan.fileRequirements.length;
      let processedFiles = 0;

      for (const fileReq of implementationPlan.fileRequirements) {
        this.addReasoningStep(`Processing file: ${fileReq.path}`);

        try {
          // Get language from file extension
          const language = this.getLanguageFromPath(fileReq.path);

          // Read existing file if modifying
          let beforeContent = '';
          if (fileReq.type === 'modify') {
            try {
              beforeContent = await this.executeTool('read_file', { path: fileReq.path });
            } catch (error) {
              this.addReasoningStep(`Could not read existing file: ${fileReq.path}`);
              beforeContent = '// File does not exist yet\n';
            }
          }

          // Generate code for this file
          const generatedCode = await this.generateCodeForFile(
            fileReq.path,
            language,
            fileReq.purpose,
            beforeContent,
            taskContext.description
          );

          this.addReasoningStep(`Generated code for: ${fileReq.path}`);

          // Create code patch
          const patch: CodePatch = {
            id: uuidv4(),
            filePath: fileReq.path,
            before: beforeContent,
            after: generatedCode,
            description: fileReq.purpose,
            reasoning: `Generated ${language} code for ${fileReq.path}`,
          };

          codePatches.push(patch);

          // Write file
          await this.executeTool('write_file', {
            path: fileReq.path,
            content: generatedCode,
          });

          this.addReasoningStep(`Wrote file: ${fileReq.path}`);

          processedFiles++;
          const progress = 20 + (processedFiles / fileCount) * 70;
          this.updateStatus('executing', Math.min(progress, 90));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.addError(`Failed to generate code for ${fileReq.path}: ${errorMessage}`, 'warning');
        }
      }

      this.addReasoningStep(`Generated code patches for ${codePatches.length} files`);
      this.updateStatus('executing', 85);

      // Generate artifact
      if (codePatches.length > 0) {
        const artifact = ArtifactGenerator.generateCodePatch(
          taskContext.id,
          this.getId(),
          codePatches
        );

        this.addArtifact(artifact);
        this.addReasoningStep('Generated code patch artifact');
      }

      this.updateStatus('executing', 95);

      // Update task state
      this.stateManager.updateTaskState(taskContext.id, {
        status: 'verifying',
        progress: 95,
      });

      this.complete();

      console.log(`[Coder] Generated code for ${codePatches.length} files`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addError(`Coder execution failed: ${errorMessage}`, 'error');
      this.updateStatus('idle');
      throw error;
    }
  }

  /**
   * Generate code for a specific file
   */
  private async generateCodeForFile(
    filePath: string,
    language: string,
    purpose: string,
    existingContent: string,
    taskDescription: string
  ): Promise<string> {
    const context = `
Task: ${taskDescription}
File Purpose: ${purpose}
Language: ${language}
File Path: ${filePath}

${existingContent ? `Existing content:\n${existingContent}\n` : ''}
`;

    const promptTemplate = this.promptManager.getTemplateByName('Coder: Generate Code');
    const prompt = this.promptManager.renderPrompt(promptTemplate.id, {
      task: taskDescription,
      filePath,
      language,
      context,
    });

    // Get code from LLM
    let generatedCode = '';
    for await (const chunk of this.streamMessage(prompt)) {
      generatedCode += chunk;
    }

    // Extract code from markdown if wrapped in code blocks
    const codeMatch = generatedCode.match(/```(?:typescript|javascript|python|bash)?\n([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }

    return generatedCode.trim();
  }

  /**
   * Get programming language from file path
   */
  private getLanguageFromPath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();

    const languageMap: { [key: string]: string } = {
      ts: 'TypeScript',
      tsx: 'TypeScript',
      js: 'JavaScript',
      jsx: 'JavaScript',
      py: 'Python',
      java: 'Java',
      cs: 'C#',
      go: 'Go',
      rs: 'Rust',
      cpp: 'C++',
      c: 'C',
      rb: 'Ruby',
      php: 'PHP',
      swift: 'Swift',
      kt: 'Kotlin',
      sh: 'Bash',
      bash: 'Bash',
      json: 'JSON',
      yaml: 'YAML',
      yml: 'YAML',
      xml: 'XML',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sql: 'SQL',
      md: 'Markdown',
    };

    return languageMap[ext || ''] || 'Text';
  }

  /**
   * Get available tools for coder
   */
  protected getAvailableTools(): string[] {
    return [
      'read_file',
      'write_file',
      'list_files',
      'search_codebase',
      'analyze_code',
      'execute_command',
    ];
  }
}
