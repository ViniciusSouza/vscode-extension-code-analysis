import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as utils from './utils'
import * as types from './types'

// Command handler for running the CamadaZero Semgrep scan
export async function handleCamadaZeroScan(config: types.CamadaZeroScanConfig) {
  // Ensure output directory exists
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  utils.VsCodeProgressWindow("CamadaZero scan in progress...",execSemgrepCmdDelegate, config);
}

function execSemgrepCmdDelegate(progress: utils.VsCodeProgress, resolve: (value: void | PromiseLike<void>) => void, config: types.CamadaZeroScanConfig): Promise<void> {
  return new Promise<void>((innerResolve) => {
    const semgrepCmd = `semgrep --config ${config.rulesPath} --json ${config.workspacePath}`;
    progress.report({ increment: 1, message: "Running Semgrep scan..." });
    exec(semgrepCmd, (err, stdout, stderr) => {
      const result: types.SemgrepScanResult | undefined = semgrepScanCallback(err, stdout, stderr, resolve);
      if (!result) {
        innerResolve();
        return;
      }
      progress.report({ increment: 50, message: "Processing Semgrep scan results..." });

      // Generate summary and write to disk
      const scanOutput: types.CamadaZeroScanResult = generateScanSummary(result);
      fs.writeFileSync(config.outputPath, JSON.stringify(scanOutput, null, 2));

      // Convert findings to diagnostics and publish them
      utils.publishDiagnostics("camadazero", result, progress);

      const { totalFiles, totalIssues } = scanOutput.summary;
      progress.report({ increment: 100, message: `CamadaZero scan complete. ${totalIssues} issues in ${totalFiles} files.` });
      innerResolve();
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

