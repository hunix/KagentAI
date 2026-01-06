/**
 * Model Configuration Commands
 */

import * as vscode from 'vscode';
import { ModelManager, ModelProfile } from '../models/model-manager';

export class ModelConfigCommand {
  constructor(private modelManager: ModelManager) {}

  /**
   * Configure LLM endpoint
   */
  async configureEndpoint(): Promise<void> {
    const endpoint = await vscode.window.showInputBox({
      prompt: 'Enter LLM API endpoint (e.g., http://localhost:8000/v1)',
      value: this.modelManager.getActiveProfile().endpoint,
      validateInput: (value) => {
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          return 'Endpoint must start with http:// or https://';
        }
        return '';
      },
    });

    if (!endpoint) {
      return;
    }

    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter API key (can be dummy for local models)',
      value: this.modelManager.getActiveProfile().apiKey,
      password: true,
    });

    if (apiKey === undefined) {
      return;
    }

    const modelName = await vscode.window.showInputBox({
      prompt: 'Enter model name',
      value: this.modelManager.getActiveProfile().modelName,
    });

    if (!modelName) {
      return;
    }

    try {
      // Update default profile
      const profile = this.modelManager.getActiveProfile();
      await this.modelManager.updateProfile(profile.id, {
        endpoint,
        apiKey,
        modelName,
      });

      // Test connection
      const isConnected = await this.modelManager.testProfile(profile.id);
      if (isConnected) {
        vscode.window.showInformationMessage(
          `✓ Successfully connected to ${modelName} at ${endpoint}`
        );
      } else {
        vscode.window.showWarningMessage(
          `⚠ Could not connect to ${endpoint}. Check your configuration.`
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to configure endpoint: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Select active model
   */
  async selectModel(): Promise<void> {
    const profiles = this.modelManager.getAllProfiles();
    const activeProfile = this.modelManager.getActiveProfile();

    const items = profiles.map(profile => ({
      label: profile.name,
      description: `${profile.modelName} (${profile.metadata.type})`,
      detail: profile.endpoint,
      profile,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a model profile',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (!selected) {
      return;
    }

    this.modelManager.switchProfile(selected.profile.id);
    vscode.window.showInformationMessage(
      `Switched to model: ${selected.profile.name}`
    );
  }

  /**
   * Test connection to current endpoint
   */
  async testConnection(): Promise<void> {
    const profile = this.modelManager.getActiveProfile();

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Testing connection to ${profile.endpoint}...`,
        cancellable: false,
      },
      async () => {
        try {
          const isConnected = await this.modelManager.testProfile(profile.id);

          if (isConnected) {
            vscode.window.showInformationMessage(
              `✓ Successfully connected to ${profile.modelName}`
            );

            // Try to list available models
            try {
              const models = await this.modelManager.listModels();
              const modelList = models
                .map(m => m.id)
                .join(', ')
                .substring(0, 100);
              vscode.window.showInformationMessage(
                `Available models: ${modelList}${models.length > 3 ? '...' : ''}`
              );
            } catch (e) {
              // Silently fail if model listing is not supported
            }
          } else {
            vscode.window.showErrorMessage(
              `✗ Failed to connect to ${profile.endpoint}`
            );
          }
        } catch (error) {
          vscode.window.showErrorMessage(
            `Connection test failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    );
  }

  /**
   * Add new model profile
   */
  async addProfile(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter profile name (e.g., "Local Mistral")',
    });

    if (!name) {
      return;
    }

    const endpoint = await vscode.window.showInputBox({
      prompt: 'Enter API endpoint',
      validateInput: (value) => {
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          return 'Must start with http:// or https://';
        }
        return '';
      },
    });

    if (!endpoint) {
      return;
    }

    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter API key',
      password: true,
    });

    if (apiKey === undefined) {
      return;
    }

    const modelName = await vscode.window.showInputBox({
      prompt: 'Enter model name',
    });

    if (!modelName) {
      return;
    }

    try {
      const profile: ModelProfile = {
        id: `profile-${Date.now()}`,
        name,
        endpoint,
        apiKey,
        modelName,
        metadata: {
          id: modelName,
          name: modelName,
          type: 'chat',
          contextWindow: 8000,
          maxTokens: 4096,
          supportsStreaming: true,
          supportsEmbeddings: false,
          supportsVision: false,
        },
      };

      await this.modelManager.addProfile(profile);
      vscode.window.showInformationMessage(`Profile "${name}" added successfully`);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to add profile: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
