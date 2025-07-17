import * as vscode from 'vscode';
import * as path from 'path';
import * as types from './types';
import { handleCamadaZeroScan } from './scanner';

// Entry point of the extension, registering the command
export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }
  
  // Define important paths for the scan
  const workspacePath = workspaceFolders[0].uri.fsPath;
  const outputDir = path.join(workspacePath, '.camadazero');
  const outputPath = path.join(outputDir, 'scan-results.json');
  const rulesPath = path.join(context.extensionPath, 'semgrep-rules');

  const config: types.CamadaZeroScanConfig = {
    rulesPath: rulesPath,
    workspacePath: workspacePath,
    outputDir: outputDir,
    outputPath: outputPath
  };

  const disposable = vscode.commands.registerCommand('camadazero.analyze', () => handleCamadaZeroScan(config));
  const participant = vscode.chat.createChatParticipant("camadazero.analyze", handler);
  context.subscriptions.push(participant);
  context.subscriptions.push(disposable);
}

// Handles chat requests for the "camadazero.analyze" chat participant
async function handler(
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  response: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  // Simple implementation: respond with a static message
  response.markdown("Hello! I am CamadaZero Analyzer. How can I assist you?");
}

// Clean up extension resources (not used in this case)
export function deactivate() {}
