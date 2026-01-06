/**
 * Agent Manager Tree View Provider
 */

import * as vscode from 'vscode';
import { ModelManager } from '../models/model-manager';

export class AgentManagerProvider implements vscode.TreeDataProvider<AgentTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<AgentTreeItem | undefined | null | void> =
    new vscode.EventEmitter<AgentTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<AgentTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private agents: Map<string, AgentTreeItem> = new Map();

  constructor(
    private context: vscode.ExtensionContext,
    private modelManager: ModelManager
  ) {}

  getTreeItem(element: AgentTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: AgentTreeItem): Promise<AgentTreeItem[]> {
    if (!element) {
      // Root level - show active model and agent status
      const profile = this.modelManager.getActiveProfile();
      
      const modelItem = new AgentTreeItem(
        `Model: ${profile.name}`,
        vscode.TreeItemCollapsibleState.None,
        {
          command: 'agentic.selectModel',
          title: 'Select Model',
          arguments: [],
        }
      );
      modelItem.iconPath = new vscode.ThemeIcon('robot');

      const statusItem = new AgentTreeItem(
        'No active agents',
        vscode.TreeItemCollapsibleState.None
      );
      statusItem.iconPath = new vscode.ThemeIcon('circle-outline');

      return [modelItem, statusItem];
    }

    return [];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(null);
  }

  addAgent(id: string, name: string): void {
    const item = new AgentTreeItem(
      name,
      vscode.TreeItemCollapsibleState.Expanded
    );
    item.iconPath = new vscode.ThemeIcon('play');
    this.agents.set(id, item);
    this.refresh();
  }

  removeAgent(id: string): void {
    this.agents.delete(id);
    this.refresh();
  }

  updateAgent(id: string, status: string): void {
    const item = this.agents.get(id);
    if (item) {
      item.label = `${item.label} [${status}]`;
      this.refresh();
    }
  }
}

export class AgentTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }
}
