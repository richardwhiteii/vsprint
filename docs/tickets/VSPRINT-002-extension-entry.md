# VSPRINT-002: Extension - Create Entry Point and Command Registration

## Status
- **Status**: [ ] Not Started
- **Assignee**: —
- **Branch**: `feature/VSPRINT-002-extension-entry`
- **Worktree**: `feat-002/`
- **PR**: —

## Ticket Info
| Field | Value |
|-------|-------|
| **Points** | 2pt |
| **Phase** | Phase 1: MVP Core Printing |
| **Dependencies** | VSPRINT-001 |
| **Parallel With** | — |
| **Priority** | High |

## Source Reference
- **Punchlist**: `PUNCHLIST_001.md`
- **Phase**: Phase 1 - MVP Core Printing
- **Tasks**: 1.2 Extension Entry Point, 1.3 Print File Command, 1.7 Basic Commands Registration

## Git Workflow

### Starting This Ticket
```bash
cd /home/richard/projects/vsprint
git worktree add feat-002 -b feature/VSPRINT-002-extension-entry dev
code feat-002
```

### During Implementation
```bash
cd feat-002
git add -A && git commit -m "feat: VSPRINT-002 extension entry point and commands"
```

### Completing This Ticket
```bash
cd feat-002
git push -u origin feature/VSPRINT-002-extension-entry
gh pr create --base dev --title "feat: VSPRINT-002 extension entry point and commands"
```

### After PR Merged
```bash
cd /home/richard/projects/vsprint
git worktree remove feat-002
cd dev && git pull origin dev
```

## Objective

Implement the VS Code extension entry point with activation/deactivation lifecycle, register the core print commands, and create command handlers that extract file metadata and content. This establishes the extension's command structure and integration with VS Code's command palette and editor context menus.

## Context

This ticket builds on VSPRINT-001 (project setup) and creates the functional extension that activates in VS Code. The extension must properly handle VS Code's extension lifecycle, register commands in the Command Palette, and provide context menu integration.

The extension follows VS Code's activation pattern where:
1. Extension remains dormant until activation event occurs
2. `activate()` function registers commands and resources
3. Commands are bound to handler functions
4. `deactivate()` cleans up resources

This ticket focuses on infrastructure and command registration. The actual rendering and printing logic will be implemented in subsequent tickets (VSPRINT-003 and VSPRINT-004).

## Implementation Approach

1. **Extension Entry Point**: Create `src/extension.ts` with activate/deactivate functions (PUNCHLIST_001.md lines 91-95)
2. **Command Registration**: Register `vsprint.printFile` and `vsprint.printSelection` commands (lines 122-126)
3. **Print File Handler**: Create `src/commands/printFile.ts` to handle file printing (lines 97-101)
4. **File Metadata Extraction**: Get active editor content, filename, language ID, and file path
5. **Error Handling**: Handle cases where no file is open or no editor is active
6. **Package.json Updates**: Add command contributions and menu items for context menu integration

## Technical Requirements

**Constraints:**
- MUST use VS Code Extension API disposable pattern for resource management
- MUST register activation event `onCommand:vsprint.printFile` in package.json
- MUST handle case when no active text editor exists (show user-friendly error)
- MUST extract file metadata: name, path, language ID, line count
- MUST add commands to Command Palette via `package.json` contributes
- SHOULD add context menu items for editor and editor title
- SHOULD provide clear user feedback when command executes
- MAY log debug information to VS Code output channel

### Source File References

Reference implementation patterns:
```
VS Code Extension Samples:
- https://github.com/microsoft/vscode-extension-samples/tree/main/helloworld-sample
- Activation pattern: activate() returns Disposable[]
- Command registration: vscode.commands.registerCommand()
```

### Files to Create/Modify

```
src/
├── extension.ts         # CREATE ~80 lines - Entry point with activate/deactivate
├── commands/
│   └── printFile.ts     # CREATE ~100 lines - Print file command handler
└── utils/
    └── logger.ts        # CREATE ~40 lines - Output channel logging

package.json             # MODIFY - Add command contributions and menu items
```

### Extension.ts Structure

**src/extension.ts**:
```typescript
import * as vscode from 'vscode';
import { printFileCommand } from './commands/printFile';
import { createLogger } from './utils/logger';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('VSPrint');
  const logger = createLogger(outputChannel);

  logger.info('VSPrint extension activating...');

  // Register print file command
  const printFile = vscode.commands.registerCommand(
    'vsprint.printFile',
    () => printFileCommand(logger)
  );

  // Register print selection command (placeholder for now)
  const printSelection = vscode.commands.registerCommand(
    'vsprint.printSelection',
    () => {
      vscode.window.showInformationMessage('Print selection coming in Phase 3');
    }
  );

  context.subscriptions.push(printFile, printSelection, outputChannel);

  logger.info('VSPrint extension activated');
}

export function deactivate() {
  outputChannel?.dispose();
}
```

### Print File Command Structure

**src/commands/printFile.ts** (PUNCHLIST_001.md lines 97-101):
```typescript
import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

export interface FileMetadata {
  fileName: string;
  filePath: string;
  languageId: string;
  lineCount: number;
  content: string;
}

export async function printFileCommand(logger: Logger): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage('No active file to print. Please open a file first.');
    logger.warn('Print command executed with no active editor');
    return;
  }

  const document = editor.document;

  const metadata: FileMetadata = {
    fileName: document.fileName.split('/').pop() || 'untitled',
    filePath: document.uri.fsPath,
    languageId: document.languageId,
    lineCount: document.lineCount,
    content: document.getText()
  };

  logger.info(`Printing file: ${metadata.fileName} (${metadata.lineCount} lines)`);

  // TODO: VSPRINT-003 will implement HTML rendering
  // TODO: VSPRINT-004 will implement printer integration

  vscode.window.showInformationMessage(
    `Ready to print: ${metadata.fileName} (${metadata.lineCount} lines)`
  );
}
```

### Logger Utility

**src/utils/logger.ts**:
```typescript
import * as vscode from 'vscode';

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export function createLogger(channel: vscode.OutputChannel): Logger {
  return {
    info: (msg: string) => channel.appendLine(`[INFO] ${msg}`),
    warn: (msg: string) => channel.appendLine(`[WARN] ${msg}`),
    error: (msg: string) => channel.appendLine(`[ERROR] ${msg}`)
  };
}
```

### Package.json Contributions

Add to `package.json` (PUNCHLIST_001.md lines 122-126):
```json
{
  "contributes": {
    "commands": [
      {
        "command": "vsprint.printFile",
        "title": "VSPrint: Print File",
        "category": "VSPrint"
      },
      {
        "command": "vsprint.printSelection",
        "title": "VSPrint: Print Selection",
        "category": "VSPrint"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "vsprint.printFile",
          "group": "9_cutcopypaste",
          "when": "editorTextFocus"
        }
      ],
      "editor/title": [
        {
          "command": "vsprint.printFile",
          "group": "navigation",
          "when": "editorIsOpen"
        }
      ]
    }
  }
}
```

## Acceptance Criteria

#### AC1: Extension Activates Successfully
- **Given** the extension is installed in VS Code
- **When** any print command is invoked
- **Then** the extension activates without errors and output channel shows "VSPrint extension activated"

#### AC2: Commands Registered in Command Palette
- **Given** the extension is activated
- **When** user opens Command Palette (Ctrl+Shift+P)
- **Then** "VSPrint: Print File" and "VSPrint: Print Selection" commands appear

#### AC3: Print File Command Handles Active File
- **Given** a file is open in the active editor
- **When** user executes "VSPrint: Print File" command
- **Then** information message shows "Ready to print: [filename] ([N] lines)"

#### AC4: Print File Command Handles No Active File
- **Given** no file is open in the editor
- **When** user executes "VSPrint: Print File" command
- **Then** error message shows "No active file to print. Please open a file first."

#### AC5: Context Menu Integration
- **Given** a file is open in the editor
- **When** user right-clicks in the editor
- **Then** "VSPrint: Print File" command appears in the context menu

#### AC6: File Metadata Extracted Correctly
- **Given** a TypeScript file with 150 lines is open
- **When** print command executes
- **Then** metadata includes correct filename, path, languageId="typescript", lineCount=150

## Testing Requirements

### Test Commands
```bash
cd feat-002
npm install
npm run compile
code .  # Opens VS Code to test extension
```

### Manual Testing in Extension Development Host

1. Press F5 to launch Extension Development Host
2. In new VS Code window, open any code file
3. Press Ctrl+Shift+P and verify "VSPrint: Print File" appears
4. Execute command and verify success message
5. Close all editors and execute command again - verify error message
6. Right-click in editor and verify command in context menu
7. Check Output panel → VSPrint channel for log messages

### Automated Test Structure

Create `test/commands/printFile.test.ts`:
```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Print File Command', () => {
  test('should show error when no active editor', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    // Test that command shows error message
  });

  test('should extract metadata from active file', async () => {
    // Test metadata extraction
  });
});
```

## AI Implementation Prompt

> **You are implementing the VS Code extension entry point and command registration for VSPrint.**
>
> **Your Task**:
> 1. Create `src/extension.ts` with activate() and deactivate() functions (PUNCHLIST_001.md lines 91-95)
> 2. Create `src/commands/printFile.ts` with file metadata extraction (lines 97-101)
> 3. Create `src/utils/logger.ts` for output channel logging
> 4. Update `package.json` to add command contributions and context menu items (lines 122-126)
> 5. Register commands: `vsprint.printFile` and `vsprint.printSelection` (placeholder)
> 6. Handle error case when no active editor exists
>
> **Worktree**: You are working in `feat-002/` worktree
>
> **Architecture Guidelines**:
> - Follow VS Code extension lifecycle: https://code.visualstudio.com/api/references/vscode-api#Extension
> - Use disposable pattern for resource cleanup
> - Commands: https://code.visualstudio.com/api/references/vscode-api#commands
> - File structure matches PUNCHLIST_context.md lines 178-209
>
> **Key Integration Points**:
> - `vscode.window.activeTextEditor` - Get active editor
> - `vscode.commands.registerCommand()` - Register commands
> - `vscode.window.createOutputChannel()` - Create output channel
> - `context.subscriptions.push()` - Register disposables
>
> **Success Criteria**:
> - Extension activates when print command is invoked
> - Commands appear in Command Palette under "VSPrint" category
> - Print File command extracts: fileName, filePath, languageId, lineCount, content
> - Graceful error handling when no file is open
> - Output channel logs activation and command execution
> - Context menu shows print commands in editor

## Completion Checklist

- [ ] `src/extension.ts` created with activate/deactivate
- [ ] `src/commands/printFile.ts` created with metadata extraction
- [ ] `src/utils/logger.ts` created for logging
- [ ] `package.json` updated with command contributions and menus
- [ ] Extension compiles without TypeScript errors
- [ ] Manual testing in Extension Development Host successful
- [ ] Commands appear in Command Palette
- [ ] Context menu integration works
- [ ] Error handling tested (no active file scenario)
- [ ] PR created against `dev` branch
- [ ] PR reviewed and merged
- [ ] Worktree removed
- [ ] Ticket marked complete

---

## Completion Record

**Completed**: —
**Actual Effort**: —
**PR**: —

### Files Created/Modified
| File | Lines | Purpose |
|------|-------|---------|
| — | — | — |

### Notes
—
