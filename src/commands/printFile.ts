import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { generatePrintHtml } from '../renderers/htmlRenderer';
import { getSettings } from '../config/settings';
import { printHtml } from '../renderers/printerRenderer';
import { codeIntelligence } from '../services/codeIntelligence';
import { withProgress } from '../utils/progress';
import { isLargeFile, confirmLargeFileRender, getPerformanceConfig } from '../utils/performance';

/**
 * Metadata extracted from the current file
 */
export interface FileMetadata {
  fileName: string;
  filePath: string;
  languageId: string;
  lineCount: number;
  content: string;
  uri: vscode.Uri;
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
    content: document.getText(),
    uri: document.uri
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

    // Get performance config
    const perfConfig = getPerformanceConfig();

    // Check if file is large and needs confirmation
    if (isLargeFile(metadata.lineCount, perfConfig.maxLines)) {
      const confirmed = await confirmLargeFileRender(metadata.lineCount);
      if (!confirmed) {
        logger.info('User cancelled printing large file');
        return;
      }
    }

    // Get user settings
    const settings = getSettings();
    logger.info(`Settings loaded: fontSize=${settings.fontSize}, showLineNumbers=${settings.showLineNumbers}`);

    // Use progress indicator for large files
    if (isLargeFile(metadata.lineCount, perfConfig.maxLines)) {
      await withProgress(
        'Printing File',
        async (reporter, token) => {
          const startTime = Date.now();

          // Step 1: Query code intelligence (20% of progress)
          reporter.reportWithTime(1, 5, startTime, 'Analyzing code structure...');

          const foldedRanges = settings.foldedRegions !== 'expand'
            ? await codeIntelligence.getFoldedRanges(metadata.uri, settings.foldedRegions)
            : [];

          // Get symbol boundaries for function/class separators
          let symbolBoundaries = settings.showSeparators
            ? await codeIntelligence.getSymbolBoundaries(metadata.uri)
            : [];

          // Get import section separator (always add if imports exist)
          const importSectionEnd = codeIntelligence.getImportSectionEnd(metadata.content, metadata.languageId);
          if (importSectionEnd > 0) {
            // Merge import separator with symbol boundaries, avoiding duplicates
            const allBoundaries = new Set([importSectionEnd, ...symbolBoundaries]);
            symbolBoundaries = Array.from(allBoundaries).sort((a, b) => a - b);
          }

          // Check cancellation
          if (token.isCancellationRequested) {
            logger.info('Print operation cancelled by user');
            throw new Error('Print operation was cancelled');
          }

          // Step 2: Generate HTML (60% of progress)
          reporter.reportWithTime(3, 5, startTime, 'Generating HTML...');
          const html = await generatePrintHtml(metadata.content, metadata, settings, symbolBoundaries, foldedRanges);
          logger.info(`HTML generated successfully (${html.length} bytes)`);

          // Check cancellation
          if (token.isCancellationRequested) {
            logger.info('Print operation cancelled by user');
            throw new Error('Print operation was cancelled');
          }

          // Step 3: Print via browser (80% of progress)
          reporter.reportWithTime(4, 5, startTime, 'Opening print dialog...');
          await printHtml(html, metadata.fileName);

          // Complete
          reporter.report('Complete!', 20);
        },
        true // Enable cancellation
      );
    } else {
      // For small files, process without progress indicator
      // Query code intelligence
      const foldedRanges = settings.foldedRegions !== 'expand'
        ? await codeIntelligence.getFoldedRanges(metadata.uri, settings.foldedRegions)
        : [];

      // Get symbol boundaries for function/class separators
      let symbolBoundaries = settings.showSeparators
        ? await codeIntelligence.getSymbolBoundaries(metadata.uri)
        : [];

      // Get import section separator (always add if imports exist)
      const importSectionEnd = codeIntelligence.getImportSectionEnd(metadata.content, metadata.languageId);
      if (importSectionEnd > 0) {
        // Merge import separator with symbol boundaries, avoiding duplicates
        const allBoundaries = new Set([importSectionEnd, ...symbolBoundaries]);
        symbolBoundaries = Array.from(allBoundaries).sort((a, b) => a - b);
      }

      // Generate HTML
      const html = await generatePrintHtml(metadata.content, metadata, settings, symbolBoundaries, foldedRanges);
      logger.info(`HTML generated successfully (${html.length} bytes)`);

      // Print via browser
      await printHtml(html, metadata.fileName);
    }

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
