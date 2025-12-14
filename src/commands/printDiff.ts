import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { generateDiffHtml } from '../renderers/diffRenderer';
import { getSettings } from '../config/settings';
import { printHtml } from '../renderers/printerRenderer';

/**
 * Git API types from vscode.git extension
 */
interface GitExtension {
  getAPI(version: 1): GitAPI;
}

interface GitAPI {
  repositories: Repository[];
}

interface Repository {
  rootUri: vscode.Uri;
  state: {
    workingTreeChanges: Change[];
    indexChanges: Change[];
  };
  diffWithHEAD(path: string): Promise<string>;
  diffIndexWithHEAD(path: string): Promise<string>;
  diffWith(ref: string, path: string): Promise<string>;
}

interface Change {
  uri: vscode.Uri;
  originalUri?: vscode.Uri;
  status: number;
}

/**
 * Diff type selection options
 */
enum DiffType {
  UNSTAGED = 'Unstaged Changes',
  STAGED = 'Staged Changes',
  FILE_HEAD = 'Current File vs HEAD'
}

/**
 * Get the Git API from VS Code Git extension
 */
async function getGitAPI(): Promise<GitAPI | undefined> {
  try {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');

    if (!gitExtension) {
      logger.warn('Git extension not found');
      return undefined;
    }

    if (!gitExtension.isActive) {
      await gitExtension.activate();
    }

    const git = gitExtension.exports.getAPI(1);
    return git;
  } catch (error) {
    logger.error('Failed to get Git API', error as Error);
    return undefined;
  }
}

/**
 * Find the repository for a given file URI
 */
function findRepository(git: GitAPI, fileUri: vscode.Uri): Repository | undefined {
  return git.repositories.find(repo => {
    const repoPath = repo.rootUri.fsPath;
    const filePath = fileUri.fsPath;
    return filePath.startsWith(repoPath);
  });
}

/**
 * Parse unified diff output into structured format
 */
interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

interface DiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

function parseDiff(diffText: string): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const lines = diffText.split('\n');

  let currentHunk: DiffHunk | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of lines) {
    // Parse hunk header: @@ -oldStart,oldLines +newStart,newLines @@
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);

    if (hunkMatch) {
      // Save previous hunk
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      // Start new hunk
      const oldStart = parseInt(hunkMatch[1], 10);
      const oldLines = parseInt(hunkMatch[2] || '1', 10);
      const newStart = parseInt(hunkMatch[3], 10);
      const newLines = parseInt(hunkMatch[4] || '1', 10);

      oldLineNum = oldStart;
      newLineNum = newStart;

      currentHunk = {
        oldStart,
        oldLines,
        newStart,
        newLines,
        lines: []
      };
      continue;
    }

    // Skip diff header lines
    if (line.startsWith('diff --git') ||
        line.startsWith('index ') ||
        line.startsWith('---') ||
        line.startsWith('+++')) {
      continue;
    }

    // Parse diff lines
    if (currentHunk) {
      if (line.startsWith('+')) {
        currentHunk.lines.push({
          type: 'add',
          content: line.substring(1),
          newLineNumber: newLineNum++
        });
      } else if (line.startsWith('-')) {
        currentHunk.lines.push({
          type: 'delete',
          content: line.substring(1),
          oldLineNumber: oldLineNum++
        });
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push({
          type: 'context',
          content: line.substring(1),
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++
        });
      }
    }
  }

  // Save last hunk
  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

/**
 * Get diff for the current file
 */
async function getDiffForFile(
  repo: Repository,
  fileUri: vscode.Uri,
  diffType: DiffType
): Promise<string> {
  const relativePath = vscode.workspace.asRelativePath(fileUri, false);

  try {
    switch (diffType) {
      case DiffType.UNSTAGED:
        return await repo.diffWithHEAD(relativePath);

      case DiffType.STAGED:
        return await repo.diffIndexWithHEAD(relativePath);

      case DiffType.FILE_HEAD:
      default:
        return await repo.diffWithHEAD(relativePath);
    }
  } catch (error) {
    logger.error(`Failed to get diff for ${relativePath}`, error as Error);
    throw error;
  }
}

/**
 * Command handler for printing git diff
 */
export async function printDiffCommand(): Promise<void> {
  logger.info('Print Diff command invoked');

  // Get the active text editor
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    const errorMessage = 'No active file to diff. Please open a file first.';
    logger.warn(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
    return;
  }

  try {
    // Get Git API
    const git = await getGitAPI();

    if (!git) {
      vscode.window.showErrorMessage('Git extension is not available. Please ensure Git is installed and the Git extension is enabled.');
      return;
    }

    // Find repository for current file
    const fileUri = editor.document.uri;
    const repo = findRepository(git, fileUri);

    if (!repo) {
      vscode.window.showWarningMessage('Current file is not in a Git repository.');
      return;
    }

    // Show QuickPick for diff type selection
    const diffTypeOptions = [
      {
        label: DiffType.UNSTAGED,
        description: 'Show unstaged changes (working tree vs HEAD)',
        value: DiffType.UNSTAGED
      },
      {
        label: DiffType.STAGED,
        description: 'Show staged changes (index vs HEAD)',
        value: DiffType.STAGED
      },
      {
        label: DiffType.FILE_HEAD,
        description: 'Show all changes (current file vs HEAD)',
        value: DiffType.FILE_HEAD
      }
    ];

    const selected = await vscode.window.showQuickPick(diffTypeOptions, {
      placeHolder: 'Select diff type to print',
      ignoreFocusOut: false
    });

    if (!selected) {
      logger.info('Diff type selection cancelled');
      return;
    }

    // Get diff text
    const diffText = await getDiffForFile(repo, fileUri, selected.value);

    if (!diffText || diffText.trim().length === 0) {
      vscode.window.showInformationMessage('No changes to display for the selected diff type.');
      logger.info('No changes found for diff');
      return;
    }

    // Parse diff
    const hunks = parseDiff(diffText);
    logger.info(`Parsed ${hunks.length} diff hunk(s)`);

    // Get settings
    const settings = getSettings();

    // Get file info
    const fileName = editor.document.fileName.split(/[\\/]/).pop() || 'Unknown';
    const filePath = editor.document.uri.fsPath;

    // Generate HTML
    const html = await generateDiffHtml(
      hunks,
      fileName,
      filePath,
      selected.label,
      settings
    );

    logger.info(`Diff HTML generated successfully (${html.length} bytes)`);

    // Print via browser
    await printHtml(html, `${fileName} - Diff`);

    logger.info('Print Diff command completed successfully');

  } catch (error) {
    const errorMessage = 'Failed to print diff';
    logger.error(errorMessage, error as Error);
    vscode.window.showErrorMessage(`${errorMessage}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Register the print diff command
 */
export function registerPrintDiffCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'vsprint.printDiff',
    printDiffCommand
  );

  context.subscriptions.push(disposable);
  logger.info('Print Diff command registered');
}

/**
 * Export types for use in diffRenderer
 */
export type { DiffHunk, DiffLine };
