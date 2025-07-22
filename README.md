# CamadaZero Analyzer

A VS Code extension for static code analysis using Semgrep rules to identify security vulnerabilities, code smells, and potential issues in your codebase.

## Features

- **Static Code Analysis**: Runs Semgrep scans on your workspace
- **Real-time Diagnostics**: Shows issues directly in VS Code's Problems panel
- **Custom Rules**: Uses configurable Semgrep rules for targeted analysis
- **Progress Tracking**: Visual progress indicators during scans
- **Detailed Reports**: Generates JSON reports with scan results and statistics

## Demo

![demo](demo.gif)

## Prerequisites

### Install Semgrep

#### Using pipx (recommended)

```bash
python -m pip install --user pipx
python -m pipx ensurepath
pipx install semgrep
```

#### Verify Installation

```bash
semgrep --version
```

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Open in VS Code and press `F5` to run the extension in a new Extension Development Host window

## Usage

1. Open a workspace/folder in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the command palette
3. Type "camadazero" and select the **CamadaZero** command
4. The extension will:
   - Run Semgrep analysis on your workspace
   - Show progress notifications
   - Display found issues in the Problems panel
   - Generate a detailed report

## Configuration

The extension uses Semgrep rules located in the `semgrep-rules/` directory. You can customize these rules based on your needs.

### Writing Custom Rules

Refer to the [Semgrep Rules Documentation](https://semgrep.dev/docs/writing-rules/rule-syntax) for guidance on creating custom rules.

## Development

### Setup

```bash
npm init -y
npm install --save-dev typescript @types/node @types/vscode
npm install --save-dev npx  # if using Yarn or need to ensure availability
```

### Running the Extension

- Run `npm install` to install dependencies
- Press `F5` or run the `Run Extension` target in the Debug View
- This will start the `npm: watch` task and launch the extension in a new VS Code window

## VS Code API Usage

### Commands

- [`commands.registerCommand`](https://code.visualstudio.com/api/references/vscode-api#commands.registerCommand)
- [`window.withProgress`](https://code.visualstudio.com/api/references/vscode-api#window.withProgress)

### Diagnostics

- [`languages.createDiagnosticCollection`](https://code.visualstudio.com/api/references/vscode-api#languages.createDiagnosticCollection)

### Contribution Points

- [`contributes.commands`](https://code.visualstudio.com/api/references/contribution-points#contributes.commands)

## File Structure

```plaintext
├── src/
│   ├── extension.ts      # Main extension entry point
│   ├── scanner.ts        # Core scanning logic
│   ├── utils.ts          # Utility functions
│   ├── types.ts          # Type definitions
│   └── copilot.ts        # GitHub Copilot integration
├── semgrep-rules/
│   └── java.yaml         # Semgrep rules configuration
└── package.json          # Extension manifest
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the terms specified in the LICENSE file.
