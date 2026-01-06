/**
 * Planner Agent
 * 
 * Responsible for breaking down user requests into high-level task plans
 * Creates structured plans with goals, approach, and steps
 */

import { BaseAgent } from './base-agent';
import { TaskPlan, TaskStep, Artifact } from './agent-types';
import { ArtifactGenerator } from '../artifacts/artifact-generator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Planner Agent
 */
export class PlannerAgent extends BaseAgent {
  /**
   * Execute planner agent
   * 
   * Breaks down the user request into a comprehensive task plan
   */
  async execute(): Promise<void> {
    try {
      this.updateStatus('planning', 10);
      this.addReasoningStep('Starting task planning phase');

      const taskContext = this.getTaskContext();

      // Get task description
      const taskDescription = taskContext.description;
      const techStack = taskContext.context.techStack.join(', ');
      const projectStructure = taskContext.context.codebaseStructure || 'New project';
      const existingPatterns = taskContext.context.existingPatterns.join(', ') || 'None';

      this.addReasoningStep('Analyzing task requirements and project context');
      this.updateStatus('planning', 20);

      // Render planner prompt
      const promptTemplate = this.promptManager.getTemplateByName('Planner: Task Breakdown');
      const prompt = this.promptManager.renderPrompt(promptTemplate.id, {
        userRequest: taskDescription,
        techStack,
        projectStructure,
        existingPatterns,
      });

      this.addReasoningStep('Rendered planning prompt with project context');
      this.updateStatus('planning', 30);

      // Get plan from LLM
      this.addReasoningStep('Requesting task plan from LLM');
      const planResponse = await this.sendMessage(prompt);

      this.addReasoningStep('Received task plan from LLM');
      this.updateStatus('planning', 60);

      // Parse plan response
      const taskPlan = this.parseTaskPlan(planResponse, taskContext.description);

      this.addReasoningStep(`Created task plan with ${taskPlan.steps.length} steps`);
      this.updateStatus('planning', 80);

      // Generate artifact
      const artifact = ArtifactGenerator.generateTaskPlan(
        taskContext.id,
        this.getId(),
        taskPlan
      );

      this.addArtifact(artifact);

      this.addReasoningStep('Generated task plan artifact');
      this.updateStatus('planning', 90);

      // Update task state with plan
      this.stateManager.updateTaskState(taskContext.id, {
        plan: taskPlan,
        status: 'planning',
        progress: 90,
      });

      this.addReasoningStep('Updated task state with plan');
      this.complete();

      console.log(`[Planner] Task plan created with ${taskPlan.steps.length} steps`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addError(`Planner execution failed: ${errorMessage}`, 'error');
      this.updateStatus('idle');
      throw error;
    }
  }

  /**
   * Parse LLM response into structured task plan
   */
  private parseTaskPlan(response: string, title: string): TaskPlan {
    // Extract plan components from LLM response
    // This is a simplified parser - in production, use structured output from LLM

    const planId = uuidv4();

    // Extract goals section
    const goalsMatch = response.match(/## Goals\n([\s\S]*?)(?=## |$)/i);
    const goals = goalsMatch
      ? goalsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim())
      : ['Complete the requested task'];

    // Extract approach section
    const approachMatch = response.match(/## Approach\n([\s\S]*?)(?=## |$)/i);
    const approach = approachMatch ? approachMatch[1].trim() : 'Follow best practices and requirements';

    // Extract steps section
    const stepsMatch = response.match(/## Steps\n([\s\S]*?)(?=## |$)/i);
    const stepsText = stepsMatch ? stepsMatch[1] : '';

    const steps = this.parseSteps(stepsText);

    // Extract estimated duration
    const durationMatch = response.match(/## Estimated Duration\n([\s\S]*?)(?=## |$)/i);
    const estimatedDuration = durationMatch ? durationMatch[1].trim() : 'To be determined';

    return {
      id: planId,
      title: `Plan: ${title}`,
      description: `Task plan for: ${title}`,
      goals,
      approach,
      steps,
      estimatedDuration,
      dependencies: [],
    };
  }

  /**
   * Parse steps from LLM response
   */
  private parseSteps(stepsText: string): TaskStep[] {
    const steps: TaskStep[] = [];
    const stepLines = stepsText.split('\n').filter(line => line.trim());

    let currentStep: Partial<TaskStep> | null = null;

    for (const line of stepLines) {
      // Check if this is a step header (e.g., "1. Step Title")
      const stepMatch = line.match(/^\d+\.\s*\*?\*?([^*]+)\*?\*?/);

      if (stepMatch) {
        // Save previous step if exists
        if (currentStep) {
          steps.push({
            id: uuidv4(),
            title: currentStep.title || 'Untitled',
            description: currentStep.description || '',
            status: 'pending',
            dependencies: [],
            artifacts: [],
          });
        }

        // Start new step
        currentStep = {
          title: stepMatch[1].trim(),
          description: '',
        };
      } else if (currentStep && line.trim()) {
        // Add to current step description
        currentStep.description = (currentStep.description || '') + '\n' + line.trim();
      }
    }

    // Add last step
    if (currentStep) {
      steps.push({
        id: uuidv4(),
        title: currentStep.title || 'Untitled',
        description: currentStep.description || '',
        status: 'pending',
        dependencies: [],
        artifacts: [],
      });
    }

    // If no steps were parsed, create a default one
    if (steps.length === 0) {
      steps.push({
        id: uuidv4(),
        title: 'Execute Task',
        description: 'Execute the requested task according to requirements',
        status: 'pending',
        dependencies: [],
        artifacts: [],
      });
    }

    return steps;
  }

  /**
   * Get available tools for planner
   */
  protected getAvailableTools(): string[] {
    return [
      'search_codebase',
      'analyze_code',
      'list_files',
    ];
  }
}
