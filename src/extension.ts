import * as vscode from 'vscode';
import { logger } from './utils/logger';
import { registerPrintFileCommand } from './commands/printFile';
import { registerPrintSelectionCommand } from './commands/printSelection';

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

    logger.info('All commands registered successfully');

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
export function deactivate(): void {
  logger.info('VSPrint extension deactivated');
  logger.dispose();
}
