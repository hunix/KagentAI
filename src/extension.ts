/**
 * Agentic IDE Extension
 * 
 * Main extension entry point
 */

import * as vscode from 'vscode';
import { ModelManager, createModelManager } from './models/model-manager';
import { AgentManagerProvider } from './ui/agent-manager-provider';
import { ArtifactsProvider } from './ui/artifacts-provider';
import { KnowledgeBaseProvider } from './ui/knowledge-base-provider';
import { ModelConfigCommand } from './commands/model-config';
import { AgentCommands } from './commands/agent-commands';

let modelManager: ModelManager;
let agentManagerProvider: AgentManagerProvider;
let artifactsProvider: ArtifactsProvider;
let knowledgeBaseProvider: KnowledgeBaseProvider;

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('Agentic IDE extension activating...');

  try {
    // Initialize model manager
    modelManager = createModelManager(context);
    console.log('Model manager initialized');

    // Test connection to default endpoint
    const defaultClient = modelManager.getActiveClient();
    const isConnected = await defaultClient.testConnection();
    
    if (isConnected) {
      vscode.window.showInformationMessage('✓ Agentic IDE connected to LLM endpoint');
    } else {
      vscode.window.showWarningMessage(
        '⚠ Agentic IDE: Cannot connect to LLM endpoint. Check your configuration.'
      );
    }

    // Initialize UI providers
    agentManagerProvider = new AgentManagerProvider(context, modelManager);
    artifactsProvider = new ArtifactsProvider(context);
    knowledgeBaseProvider = new KnowledgeBaseProvider(context);

    // Register tree view providers
    vscode.window.registerTreeDataProvider(
      'agenticAgentManager',
      agentManagerProvider
    );
    vscode.window.registerTreeDataProvider(
      'agenticArtifacts',
      artifactsProvider
    );
    vscode.window.registerTreeDataProvider(
      'agenticKnowledgeBase',
      knowledgeBaseProvider
    );

    // Register commands
    registerCommands(context, modelManager);

    // Set context flag
    await vscode.commands.executeCommand('setContext', 'agentic:agentManagerEnabled', true);

    // Show welcome message
    showWelcomeMessage();

    console.log('Agentic IDE extension activated successfully');
  } catch (error) {
    console.error('Failed to activate Agentic IDE:', error);
    vscode.window.showErrorMessage(
      `Failed to activate Agentic IDE: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Register all commands
 */
function registerCommands(
  context: vscode.ExtensionContext,
  modelManager: ModelManager
): void {
  // Model configuration commands
  const modelConfigCmd = new ModelConfigCommand(modelManager);
  context.subscriptions.push(
    vscode.commands.registerCommand('agentic.configureEndpoint', () =>
      modelConfigCmd.configureEndpoint()
    ),
    vscode.commands.registerCommand('agentic.selectModel', () =>
      modelConfigCmd.selectModel()
    ),
    vscode.commands.registerCommand('agentic.testConnection', () =>
      modelConfigCmd.testConnection()
    )
  );

  // Agent commands
  const agentCommands = new AgentCommands(modelManager, agentManagerProvider);
  context.subscriptions.push(
    vscode.commands.registerCommand('agentic.initializeAgent', () =>
      agentCommands.initialize()
    ),
    vscode.commands.registerCommand('agentic.startTask', () =>
      agentCommands.startTask()
    ),
    vscode.commands.registerCommand('agentic.pauseAgent', () =>
      agentCommands.pauseAgent()
    ),
    vscode.commands.registerCommand('agentic.resumeAgent', () =>
      agentCommands.resumeAgent()
    ),
    vscode.commands.registerCommand('agentic.cancelTask', () =>
      agentCommands.cancelTask()
    )
  );

  // Status bar command
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBar.command = 'agentic.selectModel';
  statusBar.text = '$(robot) Agentic';
  statusBar.tooltip = 'Click to select model';
  statusBar.show();
  context.subscriptions.push(statusBar);
}

/**
 * Show welcome message
 */
function showWelcomeMessage(): void {
  const message = `
🤖 Welcome to Agentic IDE!

Agentic IDE is an agent-first development environment that helps you:
- Delegate complex tasks to AI agents
- Generate code and artifacts automatically
- Maintain full visibility and control

Quick Start:
1. Configure your LLM endpoint: Cmd+Shift+P → "Agentic: Configure LLM Endpoint"
2. Start a new task: Cmd+Shift+P → "Agentic: Start New Task"
3. Monitor agents in the Agent Manager panel

Learn more: https://github.com/yourusername/agentic-ide
  `.trim();

  vscode.window.showInformationMessage(message);
}

/**
 * Extension deactivation
 */
export function deactivate() {
  console.log('Agentic IDE extension deactivating...');
}
