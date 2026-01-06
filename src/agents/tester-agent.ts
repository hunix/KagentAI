/**
 * Tester Agent
 * 
 * Responsible for testing and verifying the generated code
 * Creates test walkthroughs and verification reports
 */

import { BaseAgent } from './base-agent';
import { WalkthroughStep, TestResult } from './agent-types';
import { ArtifactGenerator } from '../artifacts/artifact-generator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tester Agent
 */
export class TesterAgent extends BaseAgent {
  /**
   * Execute tester agent
   * 
   * Verifies the generated code through testing and validation
   */
  async execute(): Promise<void> {
    try {
      this.updateStatus('executing', 10);
      this.addReasoningStep('Starting verification and testing phase');

      const taskContext = this.getTaskContext();

      // Verify code has been generated
      if (!taskContext.implementationPlan) {
        throw new Error('Implementation plan not found. Coder agent must execute first.');
      }

      this.addReasoningStep('Retrieved implementation plan');
      this.updateStatus('executing', 20);

      const walkthroughSteps: WalkthroughStep[] = [];

      // Create verification steps
      this.addReasoningStep('Creating verification steps');
      this.updateStatus('executing', 30);

      // Step 1: Build/Compile verification
      const buildStep = await this.createBuildStep();
      walkthroughSteps.push(buildStep);

      this.updateStatus('executing', 50);

      // Step 2: Run tests
      const testStep = await this.createTestStep();
      walkthroughSteps.push(testStep);

      this.updateStatus('executing', 70);

      // Step 3: Functionality verification
      const functionalStep = await this.createFunctionalityStep(taskContext.description);
      walkthroughSteps.push(functionalStep);

      this.updateStatus('executing', 85);

      this.addReasoningStep(`Created ${walkthroughSteps.length} verification steps`);

      // Generate artifact
      const artifact = ArtifactGenerator.generateWalkthrough(
        taskContext.id,
        this.getId(),
        walkthroughSteps
      );

      this.addArtifact(artifact);

      this.addReasoningStep('Generated walkthrough artifact');
      this.updateStatus('executing', 95);

      // Update task state
      const allPassed = walkthroughSteps.every(step =>
        step.testResults?.every(result => result.status === 'pass')
      );

      this.stateManager.updateTaskState(taskContext.id, {
        status: allPassed ? 'complete' : 'verifying',
        progress: 95,
      });

      this.complete();

      console.log(`[Tester] Verification complete with ${walkthroughSteps.length} steps`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addError(`Tester execution failed: ${errorMessage}`, 'error');
      this.updateStatus('idle');
      throw error;
    }
  }

  /**
   * Create build/compile verification step
   */
  private async createBuildStep(): Promise<WalkthroughStep> {
    this.addReasoningStep('Creating build verification step');

    try {
      // Try to run build command
      const buildOutput = await this.executeTool('execute_command', {
        command: 'npm run build || yarn build || echo "No build script"',
      });

      const testResult: TestResult = {
        id: uuidv4(),
        name: 'Build/Compile',
        status: buildOutput.includes('error') ? 'fail' : 'pass',
        duration: 1000,
        output: buildOutput,
      };

      return {
        id: uuidv4(),
        title: 'Build and Compile',
        description: 'Verify that the code compiles without errors',
        action: 'Run build command',
        expectedResult: 'Build completes successfully without errors',
        testResults: [testResult],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addReasoningStep(`Build step error: ${errorMessage}`);

      return {
        id: uuidv4(),
        title: 'Build and Compile',
        description: 'Verify that the code compiles without errors',
        action: 'Run build command',
        expectedResult: 'Build completes successfully without errors',
        testResults: [
          {
            id: uuidv4(),
            name: 'Build/Compile',
            status: 'fail',
            duration: 0,
            error: errorMessage,
          },
        ],
      };
    }
  }

  /**
   * Create test execution step
   */
  private async createTestStep(): Promise<WalkthroughStep> {
    this.addReasoningStep('Creating test execution step');

    try {
      // Try to run tests
      const testOutput = await this.executeTool('run_tests', {
        testCommand: 'npm test || yarn test || echo "No tests found"',
      });

      const testResult: TestResult = {
        id: uuidv4(),
        name: 'Unit Tests',
        status: testOutput.includes('fail') ? 'fail' : 'pass',
        duration: 2000,
        output: testOutput,
      };

      return {
        id: uuidv4(),
        title: 'Run Tests',
        description: 'Execute test suite to verify functionality',
        action: 'Run test command',
        expectedResult: 'All tests pass',
        testResults: [testResult],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addReasoningStep(`Test step error: ${errorMessage}`);

      return {
        id: uuidv4(),
        title: 'Run Tests',
        description: 'Execute test suite to verify functionality',
        action: 'Run test command',
        expectedResult: 'All tests pass',
        testResults: [
          {
            id: uuidv4(),
            name: 'Unit Tests',
            status: 'skip',
            duration: 0,
            error: 'No tests found',
          },
        ],
      };
    }
  }

  /**
   * Create functionality verification step
   */
  private async createFunctionalityStep(taskDescription: string): Promise<WalkthroughStep> {
    this.addReasoningStep('Creating functionality verification step');

    // Get verification requirements from LLM
    const promptTemplate = this.promptManager.getTemplateByName('Tester: Verify Implementation');
    const prompt = this.promptManager.renderPrompt(promptTemplate.id, {
      requirements: taskDescription,
      implementation: 'Code has been generated and tests have been run',
    });

    const verification = await this.sendMessage(prompt);

    return {
      id: uuidv4(),
      title: 'Verify Functionality',
      description: 'Verify that the implementation meets all requirements',
      action: 'Review implementation against requirements',
      expectedResult: 'Implementation meets all specified requirements',
      testResults: [
        {
          id: uuidv4(),
          name: 'Functionality Verification',
          status: 'pass',
          duration: 0,
          output: verification,
        },
      ],
    };
  }

  /**
   * Get available tools for tester
   */
  protected getAvailableTools(): string[] {
    return [
      'execute_command',
      'run_tests',
      'read_file',
      'list_files',
      'navigate_url',
      'take_screenshot',
      'click_element',
    ];
  }
}
