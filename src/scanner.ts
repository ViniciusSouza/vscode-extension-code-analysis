import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as utils from './utils'

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
        if (err && !stdout) {
          vscode.window.showErrorMessage(`Semgrep execution error: ${stderr}`);
          return resolve();
        }

        try {
          // Parse Semgrep results
          const result = JSON.parse(stdout);

          // Generate summary and write to disk
          const scanOutput = generateScanSummary(result);
          fs.writeFileSync(outputPath, JSON.stringify(scanOutput, null, 2));

          // Convert findings to diagnostics and publish them
          const diagnosticsMap = buildDiagnostics(result, progress);
          utils.publishDiagnostics("camadazero", diagnosticsMap);

          const { totalFiles, totalIssues } = scanOutput.summary;
          vscode.window.showInformationMessage(`CamadaZero scan complete. ${totalIssues} issues in ${totalFiles} files.`);
        } catch (e) {
          vscode.window.showErrorMessage(`Error parsing Semgrep output: ${e}`);
        } finally {
          resolve();
        }
      });
    });
  });
}

// Generate summary statistics from the Semgrep results
function generateScanSummary(result: any) {
  const totalFiles = new Set(result.results.map((r: any) => r.path)).size;
  const totalIssues = result.results.length;

  return {
    summary: { totalFiles, totalIssues },

