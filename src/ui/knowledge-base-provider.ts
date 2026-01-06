/**
 * Knowledge Base Tree View Provider
 */

import * as vscode from 'vscode';

export class KnowledgeBaseProvider implements vscode.TreeDataProvider<KnowledgeTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<KnowledgeTreeItem | undefined | null | void> =
    new vscode.EventEmitter<KnowledgeTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<KnowledgeTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private entries: Map<string, KnowledgeTreeItem> = new Map();

  constructor(private context: vscode.ExtensionContext) {}

  getTreeItem(element: KnowledgeTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: KnowledgeTreeItem): Promise<KnowledgeTreeItem[]> {
    if (!element) {
      // Root level - show knowledge categories
      const categories = [
        { label: 'Code Patterns', icon: 'symbol-class' },
        { label: 'Solutions', icon: 'lightbulb' },
        { label: 'Context', icon: 'file-directory' },
        { label: 'Embeddings', icon: 'database' },
      ];

      return categories.map(cat => {
        const item = new KnowledgeTreeItem(
          cat.label,
          vscode.TreeItemCollapsibleState.Collapsed
        );
        item.iconPath = new vscode.ThemeIcon(cat.icon);
        return item;
      });
    }

    return [];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(null);
  }

  addEntry(id: string, type: string, name: string): void {
    const item = new KnowledgeTreeItem(
      name,
      vscode.TreeItemCollapsibleState.None
    );
    item.iconPath = new vscode.ThemeIcon('file');
    this.entries.set(id, item);
    this.refresh();
  }

  removeEntry(id: string): void {
    this.entries.delete(id);
    this.refresh();
  }
}

export class KnowledgeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}
