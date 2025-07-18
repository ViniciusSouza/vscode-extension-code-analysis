import * as vscode from 'vscode';
import * as types from './types';
import * as copilot from './copilot';

export type VsCodeProgress = vscode.Progress<{ message?: string; increment?: number }>;

export type progressWindowTaskDelegate = (
  progress: VsCodeProgress,
  resolve: (value: void | PromiseLike<void>) => void,
  ...args: any[]
) => Promise<void>;

// Experimental function for showing progress windows
export function VsCodeProgressWindow(title: string, delegate: progressWindowTaskDelegate,...args: any[]) {
  return vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: title,
    cancellable: false
  }, async (progress) => {
    progress.report({ increment: 0 });

    return new Promise<void>(async (resolve) => {
      await delegate(progress, resolve, ...args);
    });
  });
}

// Send diagnostics to the VSCode problems panel
export function publishDiagnostics(name: string, result: any, progress: VsCodeProgress) {
  const diagnosticsMap = buildDiagnostics(result, progress);
  const collection = vscode.languages.createDiagnosticCollection(name);
  diagnosticsMap.forEach((diags, file) => {
    const uri = vscode.Uri.file(file);
    collection.set(uri, diags);
  });
  progress.report({ increment: 100, message: 'diagnostics published' });
}

// Build VSCode diagnostics based on Semgrep results
function buildDiagnostics(result: any, progress: VsCodeProgress): Map<string, vscode.Diagnostic[]> {
  const diagnosticsMap: Map<string, vscode.Diagnostic[]> = new Map();
  const total = result.results.length;
  // Update progress based on issue count
  progress.report({ increment: 51, message: 'building diagnostics...' });

  result.results.forEach((r: any, index: number) => {
    const filePath = r.path;
    const uri = vscode.Uri.file(filePath);

    const range = new vscode.Range(
      new vscode.Position(r.start.line - 1, r.start.col - 1),
      new vscode.Position(r.end.line - 1, r.end.col - 1)
    );

    const diagnostic = new vscode.Diagnostic(
      range,
      r.extra.message,
      vscode.DiagnosticSeverity.Warning
    );

    const existing = diagnosticsMap.get(filePath) || [];
    diagnosticsMap.set(filePath, [...existing, diagnostic]);

    // Optional: Add telemetry or logging here to track usage and scan behavior
    console.log(`[CamadaZero] Issue ${index + 1}/${total} processed from file: ${filePath}`);
  });

  return diagnosticsMap;
}


// Sends a list of prompts to GitHub Copilot Chat, with user confirmation between each one
export async function sendIssuesToCopilotChat(issues: types.SemgrepResult[]) {
  copilot.setGlobalIssues(issues)
  vscode.commands.executeCommand("workbench.action.chat.open","@c0 /analyse-semgrep-issues");
}

export async function readRangeFromFile(issue: types.SemgrepResult): Promise<string | undefined> {
  const uri = vscode.Uri.file(issue.path);
  const document = await vscode.workspace.openTextDocument(uri);

  const range = new vscode.Range(issue.start.line, issue.start.col, issue.end.line, issue.end.col);
  return document.getText(range);
}

