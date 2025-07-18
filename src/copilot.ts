import * as vscode from 'vscode';
import type { SemgrepResult } from './types';
import * as utils from './utils';

let globalIssues: SemgrepResult[];

export function setGlobalIssues(issues: SemgrepResult[]) {
  globalIssues = issues;
}


export async function chatHandler(
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  response: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  if (token.isCancellationRequested) {
    return;
  }

  const issue = globalIssues[0];

  const code = await utils.readRangeFromFile(issue)

  //for (const issue of globalIssues) {
  const basePrompt = `You are a code assistant that is helping the developer
  perform changes at his code to be camada zero compliant.
  A application that is camada zero compliant is a application that uses gRPC call to write data the
  repository calls existent in the application can still be used only for read operations.
  A Scan found a issue: ${issue.extra.message} at file ${issue.path} 
  at line ${issue.start.line} column ${issue.start.col} to line ${issue.end.line} column ${issue.end.col}
  this is the code that is causing the issue: ${code}`;
   
  const message: vscode.LanguageModelChatMessage[] = [
                  vscode.LanguageModelChatMessage.User(basePrompt),
  ]

  const chatResponse = await request.model.sendRequest(
        message,
        {},
        token
    );

    for await (const fragment of chatResponse.text) {
      response.markdown(fragment);
    }
    return;
}