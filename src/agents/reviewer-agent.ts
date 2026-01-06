/**
 * Reviewer Agent
 * 
 * Responsible for reviewing code quality and providing feedback
 * Performs code review and quality assurance checks
 */

import { BaseAgent } from './base-agent';
import { ArtifactGenerator } from '../artifacts/artifact-generator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Reviewer Agent
 */
export class ReviewerAgent extends BaseAgent {
  /**
   * Execute reviewer agent
   * 
   * Performs code review and quality assurance
   */
  async execute(): Promise<void> {
    try {
      this.updateStatus('executing', 10);
      this.addReasoningStep('Starting code review phase');

      const taskContext = this.getTaskContext();

      // Verify code has been generated and tested
      if (!taskContext.implementationPlan) {
        throw new Error('Implementation plan not found. Coder agent must execute first.');
      }

      this.addReasoningStep('Retrieved implementation plan');
      this.updateStatus('executing', 20);

      const reasoning: string[] = [];

      // Review each file
      const fileCount = taskContext.implementationPlan.fileRequirements.length;
      let reviewedFiles = 0;

      for (const fileReq of taskContext.implementationPlan.fileRequirements) {
        this.addReasoningStep(`Reviewing file: ${fileReq.path}`);

        try {
          // Read the file
          const fileContent = await this.executeTool('read_file', { path: fileReq.path });

          // Perform code review
          const review = await this.performCodeReview(fileReq.path, fileContent);

          reasoning.push(`**${fileReq.path}**:\n${review}`);

          reviewedFiles++;
          const progress = 20 + (reviewedFiles / fileCount) * 70;
          this.updateStatus('executing', Math.min(progress, 90));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.addReasoningStep(`Could not review ${fileReq.path}: ${errorMessage}`);
          reasoning.push(`**${fileReq.path}**: Could not review (${errorMessage})`);
        }
      }

      this.addReasoningStep(`Reviewed ${reviewedFiles} files`);
      this.updateStatus('executing', 85);

      // Perform overall quality assessment
      const overallAssessment = await this.performOverallAssessment(taskContext.description);
      reasoning.push(`\n**Overall Assessment**:\n${overallAssessment}`);

      this.addReasoningStep('Completed overall quality assessment');
      this.updateStatus('executing', 90);

      // Generate reasoning artifact
      const artifact = ArtifactGenerator.generateReasoning(
        taskContext.id,
        this.getId(),
        reasoning
      );

      this.addArtifact(artifact);

      this.addReasoningStep('Generated code review artifact');
      this.updateStatus('executing', 95);

      // Update task state
      this.stateManager.updateTaskState(taskContext.id, {
        status: 'complete',
        progress: 100,
      });

      this.complete();

      console.log(`[Reviewer] Code review complete for ${reviewedFiles} files`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addError(`Reviewer execution failed: ${errorMessage}`, 'error');
      this.updateStatus('idle');
      throw error;
    }
  }

  /**
   * Perform code review on a file
   */
  private async performCodeReview(filePath: string, fileContent: string): Promise<string> {
    const language = this.getLanguageFromPath(filePath);

    const reviewPrompt = `
You are a senior code reviewer. Review the following ${language} code for:
1. Code quality and readability
2. Performance implications
3. Security considerations
4. Test coverage
5. Best practices

File: ${filePath}

\`\`\`${language.toLowerCase()}
${fileContent}
\`\`\`

Provide a concise review with:
- Issues found (if any)
- Suggestions for improvement
- Overall assessment (Good/Needs Improvement/Critical Issues)
`;

    const review = await this.sendMessage(reviewPrompt);
    return review;
  }

  /**
   * Perform overall quality assessment
   */
  private async performOverallAssessment(taskDescription: string): Promise<string> {
    const taskContext = this.getTaskContext();
    const artifacts = taskContext.artifacts;

    const assessmentPrompt = `
You are a senior software architect. Provide an overall quality assessment for the completed task:

Task: ${taskDescription}

Generated Artifacts:
- Plans: ${artifacts.filter(a => a.type === 'plan').length}
- Implementation Plans: ${artifacts.filter(a => a.type === 'implementation_plan').length}
- Code Patches: ${artifacts.filter(a => a.type === 'code_patch').length}
- Walkthroughs: ${artifacts.filter(a => a.type === 'walkthrough').length}

Provide assessment on:
1. Completeness of implementation
2. Code quality
3. Test coverage
4. Documentation
5. Recommendations for improvement

Format as a structured assessment.
`;

    const assessment = await this.sendMessage(assessmentPrompt);
    return assessment;
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
   * Get available tools for reviewer
   */
  protected getAvailableTools(): string[] {
    return [
      'read_file',
      'list_files',
      'search_codebase',
      'analyze_code',
    ];
  }
}
