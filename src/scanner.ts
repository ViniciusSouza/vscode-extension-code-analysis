import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as utils from './utils'
import * as types from './types'

// Command handler for running the CamadaZero Semgrep scan
export async function handleCamadaZeroScan(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }

  // Define important paths for the scan
  const rulesPath = path.join(context.extensionPath, 'semgrep-rules');
  const workspacePath = workspaceFolders[0].uri.fsPath;
  const outputDir = path.join(workspacePath, '.camadazero');
  const outputPath = path.join(outputDir, 'scan-results.json');
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const semgrepCmd = `semgrep --config ${rulesPath} --json ${workspacePath}`;

  // Show progress while the scan is executing
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "CamadaZero scan in progress...",
    cancellable: false
  }, async (progress) => {
    progress.report({ increment: 0 });

    return new Promise<void>((resolve) => {
      // Execute the Semgrep command
      exec(semgrepCmd, (err, stdout, stderr) => {
        const result: types.SemgrepScanResult | undefined = semgrepScanCallback(err, stdout, stderr, resolve);
        if (!result) {
          return;
        }
        progress.report({ increment: 50, message: "Processing semgrep results..." });

        // Generate summary and write to disk
        const scanOutput: types.CamadaZeroScanResult = generateScanSummary(result);
        fs.writeFileSync(outputPath, JSON.stringify(scanOutput, null, 2));

        // Convert findings to diagnostics and publish them
        utils.publishDiagnostics("camadazero", result, progress);

        const { totalFiles, totalIssues } = scanOutput.summary;
        progress.report({ increment: 100, message: `CamadaZero scan complete. ${totalIssues} issues in ${totalFiles} files.` });
      });
    });
  });
}

function semgrepScanCallback(err: Error | null, stdout: string, stderr: string, resolve: (value: void | PromiseLike<void>) => void): types.SemgrepScanResult | undefined {
  if (err && !stdout) {
    vscode.window.showErrorMessage(`Semgrep execution error: ${stderr}`);
    resolve();
    return undefined;
  }

  try {
    // Parse Semgrep results
    const result = JSON.parse(stdout);
    return result;
  } catch (e) {
    vscode.window.showErrorMessage(`Error parsing Semgrep output: ${e}`);
    resolve();
    return undefined;
  }
}

// Generate summary statistics from the Semgrep results
function generateScanSummary(result: types.SemgrepScanResult) : types.CamadaZeroScanResult{
  const totalFiles = new Set(result.results.map((r: any) => r.path)).size;
  const totalIssues = result.results.length;

  return {
    summary: { totalFiles, totalIssues },
    issues: result.results,
    statistics: result.time
  };

}

