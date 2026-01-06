/**
 * Artifact Generator
 * 
 * Creates structured artifacts from agent execution
 * Supports: plans, patches, screenshots, walkthroughs, reasoning
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Artifact,
  ArtifactType,
  TaskPlan,
  ImplementationPlan,
  CodePatch,
  WalkthroughStep,
  TestResult,
  TaskState,
  AgentState,
} from '../agents/agent-types';

/**
 * Artifact Generator
 */
export class ArtifactGenerator {
  /**
   * Generate task plan artifact
   */
  static generateTaskPlan(
    taskId: string,
    agentId: string,
    plan: TaskPlan
  ): Artifact {
    return {
      id: uuidv4(),
      type: 'plan',
      agentId,
      taskId,
      content: {
        plan,
        formattedPlan: this.formatTaskPlan(plan),
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        summary: `Task Plan: ${plan.title}`,
      },
      feedback: [],
    };
  }

  /**
   * Generate implementation plan artifact
   */
  static generateImplementationPlan(
    taskId: string,
    agentId: string,
    plan: ImplementationPlan
  ): Artifact {
    return {
      id: uuidv4(),
      type: 'implementation_plan',
      agentId,
      taskId,
      content: {
        plan,
        formattedPlan: this.formatImplementationPlan(plan),
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        summary: `Implementation Plan for task ${taskId}`,
      },
      feedback: [],
    };
  }

  /**
   * Generate code patch artifact
   */
  static generateCodePatch(
    taskId: string,
    agentId: string,
    patches: CodePatch[]
  ): Artifact {
    return {
      id: uuidv4(),
      type: 'code_patch',
      agentId,
      taskId,
      content: {
        patches,
        formattedPatches: this.formatCodePatches(patches),
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        summary: `Code changes: ${patches.length} file(s) modified`,
      },
      feedback: [],
    };
  }

  /**
   * Generate screenshot artifact
   */
  static generateScreenshot(
    taskId: string,
    agentId: string,
    screenshotData: {
      data: Buffer;
      mimeType: string;
      description: string;
      timestamp: number;
    }
  ): Artifact {
    return {
      id: uuidv4(),
      type: 'screenshot',
      agentId,
      taskId,
      content: {
        data: screenshotData.data.toString('base64'),
        mimeType: screenshotData.mimeType,
        description: screenshotData.description,
        timestamp: screenshotData.timestamp,
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        summary: screenshotData.description,
      },
      feedback: [],
    };
  }

  /**
   * Generate walkthrough artifact
   */
  static generateWalkthrough(
    taskId: string,
    agentId: string,
    steps: WalkthroughStep[]
  ): Artifact {
    return {
      id: uuidv4(),
      type: 'walkthrough',
      agentId,
      taskId,
      content: {
        steps,
        formattedWalkthrough: this.formatWalkthrough(steps),
        summary: this.generateWalkthroughSummary(steps),
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        summary: `Walkthrough: ${steps.length} step(s)`,
      },
      feedback: [],
    };
  }

  /**
   * Generate reasoning artifact
   */
  static generateReasoning(
    taskId: string,
    agentId: string,
    reasoning: string[]
  ): Artifact {
    return {
      id: uuidv4(),
      type: 'reasoning',
      agentId,
      taskId,
      content: {
        reasoning,
        formattedReasoning: this.formatReasoning(reasoning),
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        summary: `Agent reasoning: ${reasoning.length} step(s)`,
      },
      feedback: [],
    };
  }

  /**
   * Format task plan for display
   */
  private static formatTaskPlan(plan: TaskPlan): string {
    let formatted = `# ${plan.title}\n\n`;
    formatted += `${plan.description}\n\n`;

    formatted += `## Goals\n`;
    plan.goals.forEach(goal => {
      formatted += `- ${goal}\n`;
    });
    formatted += '\n';

    formatted += `## Approach\n${plan.approach}\n\n`;

    formatted += `## Steps\n`;
    plan.steps.forEach((step, index) => {
      formatted += `${index + 1}. **${step.title}**\n`;
      formatted += `   ${step.description}\n`;
      if (step.dependencies.length > 0) {
        formatted += `   Dependencies: ${step.dependencies.join(', ')}\n`;
      }
      formatted += '\n';
    });

    formatted += `## Estimated Duration\n${plan.estimatedDuration}\n`;

    return formatted;
  }

  /**
   * Format implementation plan for display
   */
  private static formatImplementationPlan(plan: ImplementationPlan): string {
    let formatted = `# Implementation Plan\n\n`;

    formatted += `## Files to Create/Modify\n`;
    plan.fileRequirements.forEach(file => {
      formatted += `- **${file.path}** (${file.type})\n`;
      formatted += `  Purpose: ${file.purpose}\n`;
      if (file.dependencies.length > 0) {
        formatted += `  Dependencies: ${file.dependencies.join(', ')}\n`;
      }
      formatted += '\n';
    });

    formatted += `## Implementation Steps\n`;
    plan.steps.forEach((step, index) => {
      formatted += `${index + 1}. **${step.title}**\n`;
      formatted += `   ${step.description}\n`;
      if (step.files.length > 0) {
        formatted += `   Files: ${step.files.join(', ')}\n`;
      }
      if (step.commands && step.commands.length > 0) {
        formatted += `   Commands:\n`;
        step.commands.forEach(cmd => {
          formatted += `   \`\`\`bash\n   ${cmd}\n   \`\`\`\n`;
        });
      }
      formatted += '\n';
    });

    if (plan.dependencies.length > 0) {
      formatted += `## Dependencies\n`;
      plan.dependencies.forEach(dep => {
        formatted += `- **${dep.name}** (${dep.type})`;
        if (dep.version) {
          formatted += ` v${dep.version}`;
        }
        formatted += '\n';
      });
    }

    return formatted;
  }

  /**
   * Format code patches for display
   */
  private static formatCodePatches(patches: CodePatch[]): string {
    let formatted = `# Code Changes\n\n`;

    patches.forEach((patch, index) => {
      formatted += `## Change ${index + 1}: ${patch.filePath}\n\n`;
      formatted += `**Description:** ${patch.description}\n\n`;
      formatted += `**Reasoning:** ${patch.reasoning}\n\n`;

      formatted += `### Before\n\`\`\`\n${patch.before}\n\`\`\`\n\n`;
      formatted += `### After\n\`\`\`\n${patch.after}\n\`\`\`\n\n`;
    });

    return formatted;
  }

  /**
   * Format walkthrough for display
   */
  private static formatWalkthrough(steps: WalkthroughStep[]): string {
    let formatted = `# Verification Walkthrough\n\n`;

    steps.forEach((step, index) => {
      formatted += `## Step ${index + 1}: ${step.title}\n\n`;
      formatted += `${step.description}\n\n`;

      formatted += `**Action:** ${step.action}\n`;
      formatted += `**Expected Result:** ${step.expectedResult}\n\n`;

      if (step.testResults && step.testResults.length > 0) {
        formatted += `### Test Results\n`;
        step.testResults.forEach(result => {
          const status = result.status === 'pass' ? '✓' : '✗';
          formatted += `${status} **${result.name}** (${result.duration}ms)\n`;
          if (result.error) {
            formatted += `  Error: ${result.error}\n`;
          }
        });
        formatted += '\n';
      }
    });

    return formatted;
  }

  /**
   * Format reasoning for display
   */
  private static formatReasoning(reasoning: string[]): string {
    let formatted = `# Agent Reasoning\n\n`;

    reasoning.forEach((step, index) => {
      formatted += `${index + 1}. ${step}\n`;
    });

    return formatted;
  }

  /**
   * Generate walkthrough summary
   */
  private static generateWalkthroughSummary(steps: WalkthroughStep[]): {
    totalSteps: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
  } {
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    steps.forEach(step => {
      if (step.testResults) {
        step.testResults.forEach(result => {
          switch (result.status) {
            case 'pass':
              passedTests++;
              break;
            case 'fail':
              failedTests++;
              break;
            case 'skip':
              skippedTests++;
              break;
          }
        });
      }
    });

    return {
      totalSteps: steps.length,
      passedTests,
      failedTests,
      skippedTests,
    };
  }

  /**
   * Update artifact with feedback
   */
  static updateArtifactWithFeedback(
    artifact: Artifact,
    feedback: any
  ): Artifact {
    return {
      ...artifact,
      metadata: {
        ...artifact.metadata,
        updatedAt: Date.now(),
        version: artifact.metadata.version + 1,
      },
      feedback: [...artifact.feedback, feedback],
    };
  }

  /**
   * Create artifact summary for display
   */
  static createArtifactSummary(artifact: Artifact): string {
    let summary = `**${artifact.type.toUpperCase()}**\n`;
    summary += `Created: ${new Date(artifact.metadata.createdAt).toLocaleString()}\n`;
    summary += `Version: ${artifact.metadata.version}\n`;

    if (artifact.metadata.summary) {
      summary += `Summary: ${artifact.metadata.summary}\n`;
    }

    if (artifact.feedback.length > 0) {
      summary += `\nFeedback (${artifact.feedback.length}):\n`;
      artifact.feedback.forEach(fb => {
        summary += `- ${fb.author}: ${fb.comment}\n`;
      });
    }

    return summary;
  }

  /**
   * Export artifact to markdown
   */
  static exportToMarkdown(artifact: Artifact): string {
    let markdown = `# Artifact: ${artifact.type}\n\n`;
    markdown += `**ID:** ${artifact.id}\n`;
    markdown += `**Created:** ${new Date(artifact.metadata.createdAt).toISOString()}\n`;
    markdown += `**Version:** ${artifact.metadata.version}\n\n`;

    if (artifact.metadata.summary) {
      markdown += `## Summary\n${artifact.metadata.summary}\n\n`;
    }

    markdown += `## Content\n`;
    if (artifact.content.formattedPlan) {
      markdown += artifact.content.formattedPlan;
    } else if (artifact.content.formattedPatches) {
      markdown += artifact.content.formattedPatches;
    } else if (artifact.content.formattedWalkthrough) {
      markdown += artifact.content.formattedWalkthrough;
    } else if (artifact.content.formattedReasoning) {
      markdown += artifact.content.formattedReasoning;
    } else {
      markdown += JSON.stringify(artifact.content, null, 2);
    }

    if (artifact.feedback.length > 0) {
      markdown += `\n## Feedback\n`;
      artifact.feedback.forEach(fb => {
        markdown += `### ${fb.author} (${new Date(fb.timestamp).toLocaleString()})\n`;
        markdown += `${fb.comment}\n\n`;
      });
    }

    return markdown;
  }
}
