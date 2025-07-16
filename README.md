# Hello World Sample

This is a Hello World example that shows you how to use VS Code API.

Guide for this sample: https://code.visualstudio.com/api/get-started/your-first-extension.

## Demo

![demo](demo.gif)

## VS Code API

### `vscode` module

- [`commands.registerCommand`](https://code.visualstudio.com/api/references/vscode-api#commands.registerCommand)
- [`window.showInformationMessage`](https://code.visualstudio.com/api/references/vscode-api#window.showInformationMessage)

### Contribution Points

- [`contributes.commands`](https://code.visualstudio.com/api/references/contribution-points#contributes.commands)

## Running the Sample

- Run `npm install` in terminal to install dependencies
- Run the `Run Extension` target in the Debug View. This will:
  - Start a task `npm: watch` to compile the code
  - Run the extension in a new VS Code window

## Initialize Your Project

``` bash
npm init -y
```

Then add the VSCode extension development dependencies:

``` bash
npm install --save-dev typescript @types/node @types/vscode vscode
```

Also install npx if you're using Yarn or need to ensure it’s available:

``` bash
npm install --save-dev npx
```

## Installing semgrep

Install pipx

``` bash
python -m pip install --user pipx
python -m pipx ensurepath
```

install semgrep

```bash
pipx install semgrep
```

Verify

```bash
semgrep --version
```

## writing rules

Go to [semgrep rules doc](https://semgrep.dev/docs/writing-rules/rule-syntax)