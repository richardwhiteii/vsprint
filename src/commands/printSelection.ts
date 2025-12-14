import * as vscode from 'vscode';
import { logger } from '../utils/logger';

/**
 * Command handler for printing the current selection
 * This is a placeholder implementation for future development
 */
export async function printSelectionCommand(): Promise<void> {
  logger.info('Print Selection command invoked');

  // Get the active text editor
  const editor = vscode.window.activeTextEditor;

  // Handle case when no file is open
  if (!editor) {
    const errorMessage = 'No active file. Please open a file first.';
    logger.warn(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
    return;
  }

  // Get the current selection
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);

  // Handle case when no text is selected
  if (!selectedText || selectedText.trim().length === 0) {
    const errorMessage = 'No text selected. Please select text to print.';
    logger.warn(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
    return;
  }

  try {
    // Extract selection metadata
    const startLine = selection.start.line + 1; // Convert to 1-based
    const endLine = selection.end.line + 1;
    const lineCount = endLine - startLine + 1;

    logger.info(`Selection extracted: lines ${startLine}-${endLine} (${lineCount} lines)`);

    // Show placeholder message
    const message = `Print Selection feature will be implemented in a future update. Selected: ${lineCount} line(s)`;
    vscode.window.showInformationMessage(message);

    logger.info('Print Selection command completed (placeholder)');

  } catch (error) {
    const errorMessage = 'Failed to process selection';
    logger.error(errorMessage, error as Error);
    vscode.window.showErrorMessage(`${errorMessage}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Register the print selection command
 */
export function registerPrintSelectionCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'vsprint.printSelection',
    printSelectionCommand
  );

  context.subscriptions.push(disposable);
  logger.info('Print Selection command registered');
}
