import * as vscode from 'vscode';

// Send diagnostics to the VSCode problems panel
export function publishDiagnostics(name: string, diagnosticsMap: Map<string, vscode.Diagnostic[]>) {
  const collection = vscode.languages.createDiagnosticCollection(name);
  diagnosticsMap.forEach((diags, file) => {
    const uri = vscode.Uri.file(file);
    collection.set(uri, diags);
  });
}