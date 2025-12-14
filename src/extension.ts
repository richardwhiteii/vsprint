import * as vscode from 'vscode';
import { logger } from './utils/logger';
import { registerPrintFileCommand } from './commands/printFile';
import { registerPrintSelectionCommand } from './commands/printSelection';
import { registerPrintDiffCommand } from './commands/printDiff';
import { registerExportHtmlCommand } from './commands/exportHtml';
import { registerExportPdfCommand } from './commands/exportPdf';
import { getTempFiles, clearTempFileTracker } from './renderers/printerRenderer';
import { cleanupTempFiles } from './utils/tempFile';
import { PreviewProvider } from './webview/previewProvider';

/**
 * Extension activation function
 * Called when the extension is activated (command invoked, etc.)
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize logger
  logger.initialize('VSPrint');
  logger.info('VSPrint extension activated');

  try {
    // Register commands
    registerPrintFileCommand(context);
    registerPrintSelectionCommand(context);
    registerPrintDiffCommand(context);
    registerExportHtmlCommand(context);
    registerExportPdfCommand(context);

    // Register preview provider
    const previewProvider = new PreviewProvider(context.extensionUri);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        PreviewProvider.viewType,
        previewProvider
      )
    );

    // Register show preview command
    context.subscriptions.push(
      vscode.commands.registerCommand('vsprint.showPreview', async () => {
        // Focus the preview panel
        await vscode.commands.executeCommand('vsprint.preview.focus');
      })
    );

    logger.info('All commands and webview registered successfully');

    // Show activation message in output channel
    const outputChannel = logger.getOutputChannel();
    if (outputChannel) {
      context.subscriptions.push(outputChannel);
    }

    logger.info('VSPrint extension initialization complete');

  } catch (error) {
    logger.error('Failed to activate VSPrint extension', error as Error);
    vscode.window.showErrorMessage(
      `Failed to activate VSPrint: ${(error as Error).message}`
    );
    throw error;
  }
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
export async function deactivate(): Promise<void> {
  logger.info('VSPrint extension deactivating');

  // Clean up temporary files
  const tempFiles = getTempFiles();
  if (tempFiles.length > 0) {
    logger.info(`Cleaning up ${tempFiles.length} temporary file(s)`);
    await cleanupTempFiles(tempFiles);
    clearTempFileTracker();
  }

  logger.info('VSPrint extension deactivated');
  logger.dispose();
}
