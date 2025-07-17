// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "camadazero-analyzer" is now active!');
	
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('camadazero.analyze', async () => {
		await handleCamadaZeroScan(context);
	});

	context.subscriptions.push(disposable);
}

async function handleCamadaZeroScan(context: vscode.ExtensionContext) {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		vscode.window.showErrorMessage('No workspace is open');
		return;
	}

	const rulesPath = path.join(context.extensionPath, 'semgrep-rules');
	const workspacePath = workspaceFolders[0].uri.fsPath;
	const outputDir = path.join(workspacePath, '.camadazero');
	const outputPath = path.join(outputDir, 'scan-results.json');

	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	await prepSemgrepScan(workspacePath, rulesPath, outputPath);

}

async function prepSemgrepScan(workspacePath: string, rulesPath: string, outputPath: string) {
	let progressOption = {
		location: vscode.ProgressLocation.Notification,
		title: "CamadaZero scan in progress...",
		cancellable: false
	};

	await vscode.window.withProgress(progressOption, async (progress) => {
		progress.report({ increment: 0 });

		return new Promise<void>(async (resolve) => {
			await runSemgrepScan(workspacePath, rulesPath, outputPath, resolve, progress);
		});
	});
}

async function runSemgrepScan(workspacePath: string, rulesPath: string, outputPath: string, resolve: (value: void | PromiseLike<void>) => void, progress: vscode.Progress<{ increment: number }>) {
	
	if (!fs.existsSync(rulesPath)) {
		vscode.window.showErrorMessage(`rules path ${rulesPath} does not exist`);
		return;
	}

	const semgrepCmd = `semgrep --config ${rulesPath} --json ${workspacePath}`;

	exec(semgrepCmd, (err, stdout, stderr) => {
		if (err && !stdout) {
			vscode.window.showErrorMessage(`Semgrep error: ${stderr}`);
			return;
		}

		if (stderr && stderr.trim()) {
			vscode.window.showWarningMessage(`Semgrep warning: ${stderr.split('\\n')[0]}`);
		}
		
		fs.writeFileSync(outputPath, stdout);

		console.log(`Semgrep output: ${stdout}`);
		progress.report({ increment: 50 });

		try {
			const result = JSON.parse(stdout);
			const scanOutput = generateScanSummary(result);
			fs.writeFileSync(outputPath, JSON.stringify(scanOutput, null, 2));

			const diagnosticsMap = buildDiagnostics(result, progress);
			publishDiagnostics(diagnosticsMap);

			const { totalFiles, totalIssues, percentAffected } = scanOutput.summary;
			vscode.window.showInformationMessage(`CamadaZero scan complete. ${totalIssues} issues in ${totalFiles} files. Affected: ${percentAffected}`);
			} catch (e) {
			vscode.window.showErrorMessage(`Error parsing Semgrep output: ${e}`);
			} finally {
			resolve();
		}

	});
}

function generateScanSummary(result: any) {
	const totalFiles = new Set(result.results.map((r: any) => r.path)).size;
	const totalIssues = result.results.length;
	const percentAffected = totalFiles > 0 ? ((totalIssues / totalFiles) * 100).toFixed(1) + '%' : '0%';

	return {
		summary: { totalFiles, totalIssues, percentAffected },
		issues: result.results
	};
}

function buildDiagnostics(result: any, progress: vscode.Progress<{ increment: number }>) {
	const diagnosticsMap: Map<string, vscode.Diagnostic[]> = new Map();
	const total = result.results.length;
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

	let increment = (1 / total) * 100;
	progress.report({ increment });
	});

	return diagnosticsMap;
}

function publishDiagnostics(diagnosticsMap: Map<string, vscode.Diagnostic[]>) {
	const collection = vscode.languages.createDiagnosticCollection("camadazero");
	diagnosticsMap.forEach((diags, file) => {
	const uri = vscode.Uri.file(file);
	collection.set(uri, diags);
	});
}

export function deactivate() {}