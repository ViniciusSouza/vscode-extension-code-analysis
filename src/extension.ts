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
	const disposable = vscode.commands.registerCommand('camadazero.analyze', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('CamadaZero Extension was activated!');

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			vscode.window.showErrorMessage('No workspace is open');
			return;
		}

		const rulesPath = path.join(context.extensionPath, 'semgrep-rules');
		const workspacePath = workspaceFolders[0].uri.fsPath;
		const outputDir = path.join(workspacePath, '.camadazero');
    	const outputPath = path.join(outputDir, 'scan-results.json');
		const semgrepCmd = `semgrep --config ${rulesPath} --json ${workspacePath}`;

		if (!fs.existsSync(rulesPath)) {
			vscode.window.showErrorMessage(`rules path ${rulesPath} does not exist`);
			return;
		}

		exec(semgrepCmd, (err, stdout, stderr) => {
			if (err && !stdout) {
				vscode.window.showErrorMessage(`Semgrep error: ${stderr}`);
				return;
			}

			if (stderr && stderr.trim()) {
				vscode.window.showWarningMessage(`Semgrep warning: ${stderr.split('\\n')[0]}`);
			}

			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir);
			}
			fs.writeFileSync(outputPath, stdout);

			console.log(`Semgrep output: ${stdout}`);
		});
	});

	context.subscriptions.push(disposable);
}
