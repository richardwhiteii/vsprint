import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { generateBlameHtml } from '../renderers/blameRenderer';
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
  blame(path: string): Promise<BlameInformation>;
}

interface BlameInformation {
  readonly uri: vscode.Uri;
  readonly lines: BlameLine[];
}

interface BlameLine {
  readonly line: number;
  readonly hash: string;
  readonly author: {
    readonly name: string;
    readonly email: string;
    readonly date: Date;
  };
  readonly commit: {
    readonly hash: string;
    readonly message: string;
    readonly authorDate: Date;
  };
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
 * Get blame information for the current file
 */
async function getBlameForFile(
  repo: Repository,
  fileUri: vscode.Uri
): Promise<BlameInformation> {
  const relativePath = vscode.workspace.asRelativePath(fileUri, false);

  try {
    return await repo.blame(relativePath);
  } catch (error) {
    logger.error(`Failed to get blame for ${relativePath}`, error as Error);
    throw error;
  }
}

/**
 * Command handler for printing with git blame annotations
 */
export async function printWithBlameCommand(): Promise<void> {
  logger.info('Print with Blame command invoked');

  // Get the active text editor
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    const errorMessage = 'No active file to print. Please open a file first.';
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

    // Get blame information
    vscode.window.showInformationMessage('Fetching git blame information...');
    const blameInfo = await getBlameForFile(repo, fileUri);

    if (!blameInfo || !blameInfo.lines || blameInfo.lines.length === 0) {
      vscode.window.showWarningMessage('No blame information available for this file.');
      logger.warn('No blame information returned');
      return;
    }

    logger.info(`Retrieved blame for ${blameInfo.lines.length} line(s)`);

    // Get settings
    const settings = getSettings();

    // Get file info
    const fileName = editor.document.fileName.split(/[\\/]/).pop() || 'Unknown';
    const filePath = editor.document.uri.fsPath;
    const languageId = editor.document.languageId;
    const content = editor.document.getText();

    // Generate HTML
    const html = await generateBlameHtml(
      content,
      blameInfo,
      {
        fileName,
        filePath,
        languageId,
        lineCount: editor.document.lineCount
      },
      settings
    );

    logger.info(`Blame HTML generated successfully (${html.length} bytes)`);

    // Print via browser
    await printHtml(html, `${fileName} - Blame`);

    logger.info('Print with Blame command completed successfully');

  } catch (error) {
    const errorMessage = 'Failed to print with blame annotations';
    logger.error(errorMessage, error as Error);
    vscode.window.showErrorMessage(`${errorMessage}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Register the print with blame command
 */
export function registerPrintWithBlameCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'vsprint.printWithBlame',
    printWithBlameCommand
  );

  context.subscriptions.push(disposable);
  logger.info('Print with Blame command registered');
}

/**
 * Export types for use in blameRenderer
 */
export type { BlameInformation, BlameLine };
