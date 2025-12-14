import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { generatePrintHtml } from '../renderers/htmlRenderer';
import { getSettings } from '../config/settings';
import { FileMetadata } from './printFile';

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
 * Command handler for exporting the current file to HTML
 * Generates a standalone HTML file with embedded styles
 */
export async function exportHtmlCommand(): Promise<void> {
  logger.info('Export HTML command invoked');

  // Get the active text editor
  const editor = vscode.window.activeTextEditor;

  // Handle case when no file is open
  if (!editor) {
    const errorMessage = 'No active file to export. Please open a file first.';
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

    // Generate default filename: remove extension and add .html
    const baseFileName = metadata.fileName.replace(/\.[^/.]+$/, '');
    const defaultFileName = `${baseFileName}.html`;

    // Prompt user for save location
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(defaultFileName),
      filters: {
        'HTML': ['html']
      },
      saveLabel: 'Export HTML'
    });

    // Handle cancellation
    if (!uri) {
      logger.info('Export HTML cancelled by user');
      return;
    }

    // Write file to disk
    const buffer = Buffer.from(html, 'utf8');
    await vscode.workspace.fs.writeFile(uri, buffer);

    logger.info(`HTML exported successfully to: ${uri.fsPath}`);

    // Show success message with option to open
    const action = await vscode.window.showInformationMessage(
      `Exported to ${uri.fsPath}`,
      'Open in Browser'
    );

    // Open in browser if requested
    if (action === 'Open in Browser') {
      await vscode.env.openExternal(uri);
      logger.info('Opened exported HTML in browser');
    }

    logger.info('Export HTML command completed successfully');

  } catch (error) {
    const errorMessage = 'Failed to export HTML';
    logger.error(errorMessage, error as Error);
    vscode.window.showErrorMessage(`${errorMessage}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Register the export HTML command
 */
export function registerExportHtmlCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'vsprint.exportHtml',
    exportHtmlCommand
  );

  context.subscriptions.push(disposable);
  logger.info('Export HTML command registered');
}
