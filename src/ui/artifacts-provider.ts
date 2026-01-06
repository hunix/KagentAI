/**
 * Artifacts Tree View Provider
 */

import * as vscode from 'vscode';

export class ArtifactsProvider implements vscode.TreeDataProvider<ArtifactTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ArtifactTreeItem | undefined | null | void> =
    new vscode.EventEmitter<ArtifactTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ArtifactTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private artifacts: Map<string, ArtifactTreeItem> = new Map();

  constructor(private context: vscode.ExtensionContext) {}

  getTreeItem(element: ArtifactTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ArtifactTreeItem): Promise<ArtifactTreeItem[]> {
    if (!element) {
      // Root level - show artifact categories
      const categories = [
        { label: 'Plans', icon: 'list-tree' },
        { label: 'Code Patches', icon: 'diff' },
        { label: 'Screenshots', icon: 'device-camera' },
        { label: 'Walkthroughs', icon: 'book' },
        { label: 'Reasoning', icon: 'lightbulb' },
      ];

      return categories.map(cat => {
        const item = new ArtifactTreeItem(
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

  addArtifact(id: string, type: string, name: string): void {
    const item = new ArtifactTreeItem(
      name,
      vscode.TreeItemCollapsibleState.None
    );
    item.iconPath = new vscode.ThemeIcon('file');
    this.artifacts.set(id, item);
    this.refresh();
  }

  removeArtifact(id: string): void {
    this.artifacts.delete(id);
    this.refresh();
  }
}

export class ArtifactTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}
