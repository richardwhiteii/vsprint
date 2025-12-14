# VSPRINT-004: Printer - Implement System Printer Integration

## Status
- **Status**: [ ] Not Started
- **Assignee**: —
- **Branch**: `feature/VSPRINT-004-printer-integration`
- **Worktree**: `feat-004/`
- **PR**: —

## Ticket Info
| Field | Value |
|-------|-------|
| **Points** | 2pt |
| **Phase** | Phase 1: MVP Core Printing |
| **Dependencies** | VSPRINT-003 |
| **Parallel With** | — |
| **Priority** | High |

## Source Reference
- **Punchlist**: `PUNCHLIST_001.md`
- **Phase**: Phase 1 - MVP Core Printing
- **Tasks**: 1.5 System Printer Integration

## Git Workflow

### Starting This Ticket
```bash
cd /home/richard/projects/vsprint
git worktree add feat-004 -b feature/VSPRINT-004-printer-integration dev
code feat-004
```

### During Implementation
```bash
cd feat-004
git add -A && git commit -m "feat: VSPRINT-004 system printer integration"
```

### Completing This Ticket
```bash
cd feat-004
git push -u origin feature/VSPRINT-004-printer-integration
gh pr create --base dev --title "feat: VSPRINT-004 system printer integration"
```

### After PR Merged
```bash
cd /home/richard/projects/vsprint
git worktree remove feat-004
cd dev && git pull origin dev
```

## Objective

Implement cross-platform system printer integration that opens the native print dialog with rendered HTML content. Handle platform differences between Windows, macOS, and Linux. Provide a browser-based fallback for platforms where direct printing is unavailable. Complete the MVP printing workflow from file → HTML → printer.

## Context

This ticket completes Phase 1 (MVP Core Printing) by connecting the HTML renderer output to the system's print capabilities. VSPRINT-003 generates print-ready HTML; this ticket delivers it to the printer.

Key challenges:
1. **Cross-platform differences**: Windows, macOS, and Linux have different print APIs (PUNCHLIST_001.md line 174)
2. **VS Code environment limitations**: Extensions run in Node.js, not browser - can't use window.print()
3. **Fallback strategy**: For MVP, browser-based printing is acceptable (line 175)
4. **Temporary file management**: HTML must be written to temp file, then opened

The implementation strategy:
- Primary: Write HTML to temp file and open in default browser for printing
- Future (Phase 6): Direct printer API integration for advanced features
- Cross-platform: Use VS Code's `vscode.env.openExternal()` for consistent behavior

## Implementation Approach

1. **Printer Renderer Module**: Create `src/renderers/printerRenderer.ts` (PUNCHLIST_001.md lines 110-114)
2. **Temp File Strategy**: Write HTML to OS temp directory with unique filename
3. **Browser Integration**: Use `vscode.env.openExternal()` to open HTML in default browser
4. **Platform Detection**: Detect OS via `process.platform` for future enhancement
5. **Cleanup**: Register temp file cleanup on extension deactivate
6. **Integration**: Connect printFile command → renderHtml → printToSystem → browser print dialog

## Technical Requirements

**Constraints:**
- MUST handle cross-platform differences (Windows, macOS, Linux) (PUNCHLIST_001.md line 113, 174)
- MUST write HTML to temporary file before opening
- MUST use `vscode.env.openExternal()` for browser-based printing
- MUST clean up temporary files on extension deactivate
- SHOULD provide user feedback during print process
- SHOULD handle errors gracefully (temp file write failures, browser open failures)
- MAY implement direct print APIs in future phases
- For MVP, browser-based printing fallback is acceptable (line 114, 175)

### Source File References

VS Code APIs to use:
```
- vscode.env.openExternal(uri): Opens URI in default application
- vscode.Uri.file(path): Creates URI from file path
- process.platform: Detects OS ('win32', 'darwin', 'linux')
- fs.mkdtemp(): Creates temporary directory
- fs.writeFile(): Writes HTML to temp file
```

### Files to Create/Modify

```
src/
├── renderers/
│   └── printerRenderer.ts   # CREATE ~120 lines - System printer integration
├── utils/
│   └── tempFile.ts          # CREATE ~60 lines - Temp file management
└── commands/
    └── printFile.ts         # MODIFY - Integrate printer renderer

src/extension.ts             # MODIFY - Register temp file cleanup
```

### Printer Renderer Structure

**src/renderers/printerRenderer.ts** (PUNCHLIST_001.md lines 110-114):
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { createTempFile, registerCleanup } from '../utils/tempFile';
import { Logger } from '../utils/logger';

export interface PrintOptions {
  fileName: string;
  htmlContent: string;
}

/**
 * Prints HTML content to system printer via browser fallback.
 *
 * Strategy:
 * 1. Write HTML to temporary file
 * 2. Open temp file in default browser using vscode.env.openExternal()
 * 3. User uses browser's print dialog (Ctrl+P)
 * 4. Temp file cleaned up on extension deactivate
 */
export async function printToSystem(
  options: PrintOptions,
  logger: Logger
): Promise<void> {
  try {
    logger.info(`Preparing to print: ${options.fileName}`);

    // Create temporary HTML file
    const tempFilePath = await createTempFile(
      `vsprint-${Date.now()}.html`,
      options.htmlContent
    );

    logger.info(`Temporary file created: ${tempFilePath}`);

    // Open in default browser for printing
    const uri = vscode.Uri.file(tempFilePath);
    const opened = await vscode.env.openExternal(uri);

    if (!opened) {
      throw new Error('Failed to open browser for printing');
    }

    logger.info('Browser opened with print-ready HTML');

    // Show user instructions
    await vscode.window.showInformationMessage(
      `Print ready! Use Ctrl+P (or Cmd+P on Mac) in your browser to print ${options.fileName}`,
      'OK'
    );

  } catch (error) {
    logger.error(`Print failed: ${error}`);
    await vscode.window.showErrorMessage(
      `Failed to print: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}

/**
 * Detects current operating system platform.
 * Future phases may use this for platform-specific print APIs.
 */
export function detectPlatform(): 'windows' | 'macos' | 'linux' | 'unknown' {
  const platform = process.platform;

  switch (platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    default:
      return 'unknown';
  }
}

/**
 * Returns platform-specific print command (for future direct printing).
 * Not used in MVP - browser fallback only.
 */
export function getPlatformPrintCommand(): string | null {
  const platform = detectPlatform();

  switch (platform) {
    case 'windows':
      return null; // Future: 'powershell Start-Process -Verb Print'
    case 'macos':
      return null; // Future: 'lpr'
    case 'linux':
      return null; // Future: 'lp' or 'lpr'
    default:
      return null;
  }
}
```

### Temporary File Management

**src/utils/tempFile.ts**:
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Track temp files for cleanup
const tempFiles: string[] = [];

/**
 * Creates a temporary file with given content.
 * File is registered for cleanup on extension deactivate.
 */
export async function createTempFile(
  fileName: string,
  content: string
): Promise<string> {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, fileName);

  await fs.writeFile(filePath, content, 'utf-8');

  // Register for cleanup
  tempFiles.push(filePath);

  return filePath;
}

/**
 * Cleans up all temporary files created by the extension.
 * Should be called from extension's deactivate() function.
 */
export async function cleanupTempFiles(): Promise<void> {
  const deletePromises = tempFiles.map(async (filePath) => {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File may already be deleted - ignore errors
      console.warn(`Failed to delete temp file ${filePath}:`, error);
    }
  });

  await Promise.all(deletePromises);
  tempFiles.length = 0; // Clear array
}

/**
 * Returns list of temporary files currently tracked.
 * Useful for debugging.
 */
export function getTempFiles(): readonly string[] {
  return [...tempFiles];
}
```

### Integration with Print File Command

Update `src/commands/printFile.ts`:
```typescript
import { renderHtml } from '../renderers/htmlRenderer';
import { printToSystem } from '../renderers/printerRenderer';

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

  // Render HTML
  const html = renderHtml(metadata);
  logger.info(`HTML rendered: ${html.length} bytes`);

  // Print to system
  await printToSystem({
    fileName: metadata.fileName,
    htmlContent: html
  }, logger);
}
```

### Extension Cleanup Integration

Update `src/extension.ts`:
```typescript
import { cleanupTempFiles } from './utils/tempFile';

export async function deactivate() {
  outputChannel?.dispose();

  // Clean up temporary files
  await cleanupTempFiles();
}
```

## Acceptance Criteria

#### AC1: Browser Opens with Print-Ready HTML
- **Given** a file is open in the editor
- **When** user executes "VSPrint: Print File" command
- **Then** default browser opens with rendered HTML

#### AC2: User Receives Print Instructions
- **Given** browser opens successfully
- **When** HTML is displayed
- **Then** VS Code shows message: "Print ready! Use Ctrl+P (or Cmd+P on Mac) in your browser to print [filename]"

#### AC3: Temporary File Created
- **Given** print command executes
- **When** HTML is generated
- **Then** temporary file is created in OS temp directory with name format `vsprint-[timestamp].html`

#### AC4: Temporary Files Cleaned Up
- **Given** extension has created temporary files
- **When** extension deactivates
- **Then** all temporary files are deleted from OS temp directory

#### AC5: Error Handling for Browser Open Failure
- **Given** browser cannot open (e.g., no default browser)
- **When** `vscode.env.openExternal()` fails
- **Then** error message shows "Failed to print: [error details]"

#### AC6: Cross-Platform Compatibility
- **Given** extension runs on Windows, macOS, or Linux
- **When** print command executes
- **Then** browser opens correctly on all platforms

## Testing Requirements

### Test Commands
```bash
cd feat-004
npm run compile
npm test -- --grep "Printer"
```

### Automated Tests

Create `test/renderers/printerRenderer.test.ts`:
```typescript
import * as assert from 'assert';
import { detectPlatform, getPlatformPrintCommand } from '../../src/renderers/printerRenderer';

suite('Printer Renderer', () => {
  test('should detect platform correctly', () => {
    const platform = detectPlatform();
    assert.ok(['windows', 'macos', 'linux', 'unknown'].includes(platform));
  });

  test('should return null for platform print commands (MVP)', () => {
    const command = getPlatformPrintCommand();
    assert.strictEqual(command, null, 'MVP uses browser fallback only');
  });
});
```

Create `test/utils/tempFile.test.ts`:
```typescript
import * as assert from 'assert';
import * as fs from 'fs/promises';
import { createTempFile, cleanupTempFiles, getTempFiles } from '../../src/utils/tempFile';

suite('Temp File Management', () => {
  test('should create temp file with content', async () => {
    const content = '<html><body>Test</body></html>';
    const filePath = await createTempFile('test.html', content);

    const readContent = await fs.readFile(filePath, 'utf-8');
    assert.strictEqual(readContent, content);
  });

  test('should track temp files', async () => {
    await createTempFile('test1.html', 'content1');
    const tracked = getTempFiles();
    assert.ok(tracked.length > 0);
  });

  test('should cleanup temp files', async () => {
    const filePath = await createTempFile('cleanup-test.html', 'test');

    await cleanupTempFiles();

    try {
      await fs.access(filePath);
      assert.fail('File should have been deleted');
    } catch (error) {
      // Expected - file should not exist
      assert.ok(true);
    }
  });
});
```

### Manual Testing

**Windows Testing**:
1. Build extension and launch Extension Development Host
2. Open any code file (e.g., `test.ts`)
3. Run "VSPrint: Print File" command
4. Verify default browser (Edge/Chrome) opens
5. Verify HTML content displays with line numbers
6. Press Ctrl+P in browser and verify print dialog opens
7. Close Extension Development Host
8. Check Windows %TEMP% directory - verify temp files deleted

**macOS Testing**:
1. Same steps as Windows
2. Verify Safari/default browser opens
3. Use Cmd+P for print dialog
4. Check /tmp directory for cleanup

**Linux Testing**:
1. Same steps as Windows
2. Verify Firefox/Chrome opens
3. Use Ctrl+P for print dialog
4. Check /tmp directory for cleanup

### Integration Testing

Full workflow test:
1. Open a TypeScript file with 100+ lines
2. Change settings: fontSize=12, showLineNumbers=true
3. Run print command
4. Verify:
   - Browser opens within 2 seconds
   - HTML shows correct filename in header
   - Line numbers 1-100+ are visible
   - Font size is 12pt in browser
   - Print preview (Ctrl+P) shows proper margins
   - After closing VS Code, temp file is deleted

## AI Implementation Prompt

> **You are implementing system printer integration for VSPrint using browser-based fallback.**
>
> **Your Task**:
> 1. Create `src/renderers/printerRenderer.ts` with printToSystem() function (PUNCHLIST_001.md lines 110-114)
> 2. Create `src/utils/tempFile.ts` for temporary file management
> 3. Update `src/commands/printFile.ts` to call printToSystem() after renderHtml()
> 4. Update `src/extension.ts` deactivate() to cleanup temp files
> 5. Handle cross-platform differences via process.platform (line 113)
> 6. Use vscode.env.openExternal() to open browser (line 114)
>
> **Worktree**: You are working in `feat-004/` worktree
>
> **Architecture Guidelines**:
> - Browser fallback is acceptable for MVP (PUNCHLIST_001.md lines 114, 175)
> - Use OS temp directory for HTML files (os.tmpdir())
> - VS Code API: https://code.visualstudio.com/api/references/vscode-api#env
> - Temp file format: `vsprint-[timestamp].html`
> - Cross-platform: Windows='win32', macOS='darwin', Linux='linux'
>
> **Key Integration Points**:
> - HTML from VSPRINT-003's renderHtml() is passed to printToSystem()
> - `vscode.env.openExternal(vscode.Uri.file(path))` opens browser
> - Temp files registered in array for cleanup
> - extension.deactivate() calls cleanupTempFiles()
>
> **Success Criteria**:
> - Browser opens with HTML content on all platforms (Windows, macOS, Linux)
> - User sees instruction message about using browser print dialog
> - Temporary files created in OS temp directory
> - Temporary files deleted on extension deactivate
> - Error handling for browser open failures
> - Tests pass: 5+ tests for printer and temp file management

## Completion Checklist

- [ ] `src/renderers/printerRenderer.ts` created with printToSystem()
- [ ] `src/utils/tempFile.ts` created with temp file management
- [ ] `src/commands/printFile.ts` updated to call printToSystem()
- [ ] `src/extension.ts` deactivate() updated with cleanup
- [ ] Platform detection implemented (detectPlatform())
- [ ] Tests written and passing (5+ tests)
- [ ] Manual testing on at least one platform successful
- [ ] Browser opens with correct HTML content
- [ ] Print dialog accessible via Ctrl+P/Cmd+P
- [ ] Temp files cleaned up after extension closes
- [ ] Error handling tested (invalid file path, browser failure)
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

---

## Phase 1 Completion

This ticket completes **Phase 1: MVP Core Printing**. After merging, verify:

### Phase 1 Success Criteria (PUNCHLIST_001.md lines 156-161)
- [ ] Given a file is open in the editor, When user runs "VSPrint: Print File" command, Then print dialog opens with formatted content
- [ ] Given no file is open, When user runs print command, Then informative error message is displayed
- [ ] Given user has configured font size in settings, When printing, Then output uses configured font size
- [ ] Given a file with 100+ lines, When printing, Then all lines have correct line numbers
- [ ] All tests pass: `npm test`

### Validation Checkpoint (lines 164-171)
Before proceeding to Phase 2:
- [ ] All tasks checked off in PUNCHLIST_001.md Phase 1
- [ ] Extension activates without errors
- [ ] Print command appears in Command Palette
- [ ] Basic print to system printer works on at least one platform
- [ ] Tests passing: 12+ tests
- [ ] Code committed with message: "feat: MVP core printing functionality"

### Next Steps
After Phase 1 completion:
1. Merge all Phase 1 PRs to `dev` branch
2. Promote `dev` → `test` for QA validation
3. Run full test suite in `test` worktree
4. Create Phase 2 tickets (VSPRINT-005 through VSPRINT-008)
5. Begin Phase 2: Enhanced Formatting (Syntax Highlighting with Shiki)
