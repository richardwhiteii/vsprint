import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { renderNotebook } from '../renderers/notebookRenderer';
import { getSettings } from '../config/settings';
import { printHtml } from '../renderers/printerRenderer';

/**
 * Command handler for printing Jupyter notebooks
 */
export async function printNotebookCommand(): Promise<void> {
  logger.info('Print Notebook command invoked');

  // Get the active text editor
  const editor = vscode.window.activeTextEditor;

  // Handle case when no file is open
  if (!editor) {
    const errorMessage = 'No active file to print. Please open a notebook file first.';
    logger.warn(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
    return;
  }

  const document = editor.document;

  // Verify this is a notebook file
  if (!document.fileName.endsWith('.ipynb')) {
    const errorMessage = 'Active file is not a Jupyter notebook (.ipynb). Please open a notebook file.';
    logger.warn(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
    return;
  }

  try {
    // Get notebook content
    const notebookContent = document.getText();
    const fileName = document.fileName.split(/[\\/]/).pop() || 'notebook.ipynb';

    logger.info(`Rendering notebook: ${fileName}`);

    // Get user settings
    const settings = getSettings();
    logger.info(`Settings loaded: fontSize=${settings.fontSize}, theme=${settings.theme}`);

    // Render notebook to HTML
    const html = await renderNotebook(notebookContent, fileName, settings);
    logger.info(`Notebook HTML generated successfully (${html.length} bytes)`);

    // Print via browser
    await printHtml(html, fileName);

    logger.info('Print Notebook command completed successfully');

  } catch (error) {
    const errorMessage = 'Failed to print notebook';
    logger.error(errorMessage, error as Error);
    vscode.window.showErrorMessage(`${errorMessage}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Register the print notebook command
 */
export function registerPrintNotebookCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'vsprint.printNotebook',
    printNotebookCommand
  );

  context.subscriptions.push(disposable);
  logger.info('Print Notebook command registered');
}
