/**
 * Architect Agent
 * 
 * Responsible for creating detailed implementation plans from task plans
 * Breaks down tasks into specific file requirements and implementation steps
 */

import { BaseAgent } from './base-agent';
import { ImplementationPlan, ImplementationStep, FileRequirement, Dependency } from './agent-types';
import { ArtifactGenerator } from '../artifacts/artifact-generator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Architect Agent
 */
export class ArchitectAgent extends BaseAgent {
  /**
   * Execute architect agent
   * 
   * Creates a detailed implementation plan from the task plan
   */
  async execute(): Promise<void> {
    try {
      this.updateStatus('executing', 10);
      this.addReasoningStep('Starting architecture planning phase');

      const taskContext = this.getTaskContext();

      // Verify task plan exists
      if (!taskContext.plan) {
        throw new Error('Task plan not found. Planner agent must execute first.');
      }

      this.addReasoningStep('Retrieved task plan from context');
      this.updateStatus('executing', 20);

      const techStack = taskContext.context.techStack.join(', ');
      const projectStructure = taskContext.context.codebaseStructure || 'New project';
      const taskPlanStr = JSON.stringify(taskContext.plan, null, 2);

      this.addReasoningStep('Analyzing task plan for implementation details');
      this.updateStatus('executing', 30);

      // Render architect prompt
      const promptTemplate = this.promptManager.getTemplateByName('Architect: Implementation Plan');
      const prompt = this.promptManager.renderPrompt(promptTemplate.id, {
        taskPlan: taskPlanStr,
        techStack,
        projectStructure,
      });

      this.addReasoningStep('Rendered architecture prompt');
      this.updateStatus('executing', 40);

      // Get implementation plan from LLM
      this.addReasoningStep('Requesting implementation plan from LLM');
      const planResponse = await this.sendMessage(prompt);

      this.addReasoningStep('Received implementation plan from LLM');
      this.updateStatus('executing', 60);

      // Parse implementation plan
      const implementationPlan = this.parseImplementationPlan(planResponse, taskContext.id);

      this.addReasoningStep(
        `Created implementation plan with ${implementationPlan.steps.length} steps and ${implementationPlan.fileRequirements.length} files`
      );
      this.updateStatus('executing', 80);

      // Generate artifact
      const artifact = ArtifactGenerator.generateImplementationPlan(
        taskContext.id,
        this.getId(),
        implementationPlan
      );

      this.addArtifact(artifact);

      this.addReasoningStep('Generated implementation plan artifact');
      this.updateStatus('executing', 90);

      // Update task state with implementation plan
      this.stateManager.updateTaskState(taskContext.id, {
        implementationPlan,
        status: 'executing',
        progress: 90,
      });

      this.addReasoningStep('Updated task state with implementation plan');
      this.complete();

      console.log(
        `[Architect] Implementation plan created with ${implementationPlan.steps.length} steps`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addError(`Architect execution failed: ${errorMessage}`, 'error');
      this.updateStatus('idle');
      throw error;
    }
  }

  /**
   * Parse LLM response into structured implementation plan
   */
  private parseImplementationPlan(response: string, taskId: string): ImplementationPlan {
    const planId = uuidv4();

    // Extract files to create/modify
    const filesMatch = response.match(/## Files to Create\/Modify\n([\s\S]*?)(?=## |$)/i);
    const fileRequirements = filesMatch
      ? this.parseFileRequirements(filesMatch[1])
      : [
          {
            path: 'src/index.ts',
            purpose: 'Main implementation file',
            type: 'create' as const,
            dependencies: [],
          },
        ];

    // Extract implementation steps
    const stepsMatch = response.match(/## Implementation Steps\n([\s\S]*?)(?=## |$)/i);
    const steps = stepsMatch ? this.parseImplementationSteps(stepsMatch[1]) : [];

    // Extract dependencies
    const depsMatch = response.match(/## Dependencies\n([\s\S]*?)(?=## |$)/i);
    const dependencies = depsMatch ? this.parseDependencies(depsMatch[1]) : [];

    return {
      id: planId,
      taskId,
      steps: steps.length > 0 ? steps : this.createDefaultSteps(fileRequirements),
      fileRequirements,
      dependencies,
    };
  }

  /**
   * Parse file requirements from response
   */
  private parseFileRequirements(filesText: string): FileRequirement[] {
    const files: FileRequirement[] = [];
    const fileLines = filesText.split('\n').filter(line => line.trim());

    for (const line of fileLines) {
      // Match file entries like "- **path/to/file.ts** (create)"
      const fileMatch = line.match(/^-\s*\*?\*?([^*()]+)\*?\*?\s*\(([^)]+)\)/);

      if (fileMatch) {
        const path = fileMatch[1].trim();
        const type = fileMatch[2].toLowerCase() as 'create' | 'modify' | 'delete';

        // Extract purpose from next line if available
        let purpose = 'Implementation file';

        files.push({
          path,
          purpose,
          type,
          dependencies: [],
        });
      }
    }

    return files;
  }

  /**
   * Parse implementation steps from response
   */
  private parseImplementationSteps(stepsText: string): ImplementationStep[] {
    const steps: ImplementationStep[] = [];
    const stepLines = stepsText.split('\n').filter(line => line.trim());

    let currentStep: Partial<ImplementationStep> | null = null;

    for (const line of stepLines) {
      // Check if this is a step header (e.g., "1. Step Title")
      const stepMatch = line.match(/^\d+\.\s*\*?\*?([^*]+)\*?\*?/);

      if (stepMatch) {
        // Save previous step
        if (currentStep) {
          steps.push({
            id: uuidv4(),
            title: currentStep.title || 'Untitled',
            description: currentStep.description || '',
            files: currentStep.files || [],
            commands: currentStep.commands,
          });
        }

        // Start new step
        currentStep = {
          title: stepMatch[1].trim(),
          description: '',
          files: [],
          commands: [],
        };
      } else if (currentStep) {
        // Check for commands
        if (line.includes('```')) {
          const cmdMatch = line.match(/```(?:bash|sh)?\n([\s\S]*?)```/);
          if (cmdMatch && currentStep.commands) {
            currentStep.commands.push(cmdMatch[1].trim());
          }
        } else if (line.trim()) {
          // Add to description
          currentStep.description = (currentStep.description || '') + '\n' + line.trim();
        }
      }
    }

    // Add last step
    if (currentStep) {
      steps.push({
        id: uuidv4(),
        title: currentStep.title || 'Untitled',
        description: currentStep.description || '',
        files: currentStep.files || [],
        commands: currentStep.commands,
      });
    }

    return steps;
  }

  /**
   * Parse dependencies from response
   */
  private parseDependencies(depsText: string): Dependency[] {
    const dependencies: Dependency[] = [];
    const depLines = depsText.split('\n').filter(line => line.trim());

    for (const line of depLines) {
      // Match dependency entries like "- **name** (type) vX.Y.Z"
      const depMatch = line.match(/^-\s*\*?\*?([^*()]+)\*?\*?\s*\(([^)]+)\)(?:\s+v(.+))?/);

      if (depMatch) {
        const name = depMatch[1].trim();
        const type = depMatch[2].toLowerCase() as 'npm' | 'pip' | 'system' | 'other';
        const version = depMatch[3]?.trim();

        dependencies.push({
          name,
          version,
          type,
        });
      }
    }

    return dependencies;
  }

  /**
   * Create default implementation steps if none were parsed
   */
  private createDefaultSteps(fileRequirements: FileRequirement[]): ImplementationStep[] {
    return [
      {
        id: uuidv4(),
        title: 'Set up project structure',
        description: 'Create necessary directories and configuration files',
        files: fileRequirements.map(f => f.path),
      },
      {
        id: uuidv4(),
        title: 'Implement core functionality',
        description: 'Implement the main features according to the plan',
        files: fileRequirements.filter(f => f.type === 'create').map(f => f.path),
      },
      {
        id: uuidv4(),
        title: 'Add tests',
        description: 'Create comprehensive test coverage',
        files: [],
      },
      {
        id: uuidv4(),
        title: 'Documentation',
        description: 'Add documentation and comments',
        files: [],
      },
    ];
  }

  /**
   * Get available tools for architect
   */
  protected getAvailableTools(): string[] {
    return [
      'search_codebase',
      'analyze_code',
      'list_files',
    ];
  }
}
