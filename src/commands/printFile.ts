import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { generatePrintHtml } from '../renderers/htmlRenderer';
import { getSettings } from '../config/settings';
import { printHtml } from '../renderers/printerRenderer';

/**
 * Metadata extracted from the current file
 */
export interface FileMetadata {
  fileName: string;
  filePath: string;
  languageId: string;
  lineCount: number;
  content: string;
}

/**
 * Extract metadata from the active text editor
 */
function extractFileMetadata(editor: vscode.TextEditor): FileMetadata {
  const document = editor.document;

  return {
    fileName: document.fileName.split(/[\\/]/).pop() || 'Unknown',
    filePath: document.uri.fsPath,
    languageId: document.languageId,
    lineCount: document.lineCount,
    content: document.getText()
  };
}

/**
 * Command handler for printing the current file
 * Extracts file metadata and prepares it for printing
 */
export async function printFileCommand(): Promise<void> {
  logger.info('Print File command invoked');

  // Get the active text editor
  const editor = vscode.window.activeTextEditor;

  // Handle case when no file is open
  if (!editor) {
    const errorMessage = 'No active file to print. Please open a file first.';
    logger.warn(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
    return;
  }

  try {
    // Extract file metadata
    const metadata = extractFileMetadata(editor);

    logger.info(`File metadata extracted: ${metadata.fileName} (${metadata.lineCount} lines)`);

    // Get user settings
    const settings = getSettings();
    logger.info(`Settings loaded: fontSize=${settings.fontSize}, showLineNumbers=${settings.showLineNumbers}`);

    // Generate HTML
    const html = await generatePrintHtml(metadata.content, metadata, settings);
    logger.info(`HTML generated successfully (${html.length} bytes)`);

    // Print via browser
    await printHtml(html, metadata.fileName);

    logger.info('Print File command completed successfully');

  } catch (error) {
    const errorMessage = 'Failed to print file';
    logger.error(errorMessage, error as Error);
    vscode.window.showErrorMessage(`${errorMessage}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Register the print file command
 */
export function registerPrintFileCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'vsprint.printFile',
    printFileCommand
  );

  context.subscriptions.push(disposable);
  logger.info('Print File command registered');
}
