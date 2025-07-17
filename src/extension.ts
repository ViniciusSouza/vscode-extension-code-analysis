import * as vscode from 'vscode';
import { handleCamadaZeroScan } from './scanner';

// Entry point of the extension, registering the command
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('camadazero.analyze', () => handleCamadaZeroScan(context));
  context.subscriptions.push(disposable);
}

// Clean up extension resources (not used in this case)
export function deactivate() {}
