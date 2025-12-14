import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { generatePrintHtml } from '../renderers/htmlRenderer';
import { getSettings } from '../config/settings';
import { FileMetadata } from './printFile';
import { withProgress, getPdfJobQueue } from '../utils/progress';

/**
 * Lazy-loaded PDF renderer to avoid loading puppeteer on extension startup
 */
async function getPdfRenderer() {
  const { renderToPdf, validatePdfOptions } = await import('../renderers/pdfRenderer');
  return { renderToPdf, validatePdfOptions };
}

/**
 * PDF options interface
 */
export interface PdfOptions {
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  orientation: 'portrait' | 'landscape';
  paperSize: 'A4' | 'Letter' | 'Legal' | 'custom';
  customSize?: {
    width: number;
    height: number;
  };
}

/**
 * Get PDF options from VS Code configuration
 *
 * @returns PDF generation options
 */
function getPdfOptions(): PdfOptions {
  const config = vscode.workspace.getConfiguration('vsprint.pdf');

  return {
    margins: config.get('margins', {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    }),
    orientation: config.get<'portrait' | 'landscape'>('orientation', 'portrait'),
    paperSize: config.get<'A4' | 'Letter' | 'Legal' | 'custom'>('paperSize', 'A4'),
    customSize: config.get('customSize', {
      width: 210,
      height: 297
    })
  };
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
 * Generate default PDF filename from source file
 *
 * @param sourceFileName - Original source file name
 * @returns PDF filename with .pdf extension
 */
function getDefaultPdfFileName(sourceFileName: string): string {
  const baseName = path.basename(sourceFileName, path.extname(sourceFileName));
  return `${baseName}.pdf`;
}

/**
 * Save PDF buffer to file
 *
 * @param buffer - PDF buffer to save
 * @param filePath - Destination file path
 */
async function savePdfToFile(buffer: Buffer, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        reject(new Error(`Failed to write PDF file: ${err.message}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Command handler for exporting current file to PDF
 * Generates HTML, converts to PDF using Puppeteer, and saves to disk
 */
export async function exportPdfCommand(): Promise<void> {
  logger.info('Export to PDF command invoked');

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

    // Get print settings
    const settings = getSettings();
    logger.info(`Print settings loaded: fontSize=${settings.fontSize}, theme=${settings.theme}`);

    // Get PDF options
    const pdfOptions = getPdfOptions();
    logger.info(`PDF options loaded: ${JSON.stringify(pdfOptions)}`);

    // Lazy-load PDF renderer
    const { validatePdfOptions } = await getPdfRenderer();

    // Validate PDF options
    try {
      validatePdfOptions(pdfOptions);
    } catch (validationError) {
      const errorMessage = `Invalid PDF configuration: ${(validationError as Error).message}`;
      logger.error(errorMessage, validationError as Error);
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    // Show save dialog
    const defaultFileName = getDefaultPdfFileName(metadata.fileName);
    const saveUri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(defaultFileName),
      filters: {
        'PDF Files': ['pdf']
      },
      saveLabel: 'Export PDF'
    });

    // User cancelled the save dialog
    if (!saveUri) {
      logger.info('PDF export cancelled by user');
      return;
    }

    const outputPath = saveUri.fsPath;
    logger.info(`PDF output path: ${outputPath}`);

    // Show progress notification with cancellation support
    await withProgress(
      'Exporting to PDF',
      async (reporter, token) => {
        const startTime = Date.now();

        // Step 1: Generate HTML (30% of progress)
        reporter.report('Generating HTML...', 30);
        const html = await generatePrintHtml(metadata.content, metadata, settings);
        logger.info(`HTML generated successfully (${html.length} bytes)`);

        // Check if operation was cancelled
        if (token.isCancellationRequested) {
          logger.info('PDF export cancelled by user');
          throw new Error('PDF export was cancelled');
        }

        // Get the job queue
        const jobQueue = getPdfJobQueue();
        const queueSize = jobQueue.getQueueSize();

        // Show queue status if there are other jobs
        if (queueSize > 0) {
          vscode.window.showInformationMessage(
            `PDF generation queued (${queueSize} job(s) ahead). You'll be notified when it's ready.`
          );
        }

        // Step 2: Queue PDF generation (40% of progress)
        reporter.report('Queuing PDF generation...', 10);

        // Enqueue the PDF generation job
        const pdfBuffer = await jobQueue.enqueue(
          html,
          pdfOptions,
          outputPath,
          metadata.fileName,
          token
        );

        // Check if operation was cancelled
        if (token.isCancellationRequested) {
          logger.info('PDF export cancelled by user');
          throw new Error('PDF export was cancelled');
        }

        logger.info(`PDF buffer created (${pdfBuffer.length} bytes)`);

        // Step 3: Save to file (50% of progress)
        reporter.reportWithTime(8, 10, startTime, 'Saving PDF file...');
        await savePdfToFile(pdfBuffer, outputPath);
        logger.info(`PDF saved to: ${outputPath}`);

        // Complete (100% of progress)
        reporter.report('Complete!', 10);

        // Show success notification with "Open" action
        const openAction = 'Open';
        const result = await vscode.window.showInformationMessage(
          `PDF ready: ${path.basename(outputPath)}`,
          openAction
        );

        // Open PDF if user clicked the action
        if (result === openAction) {
          await vscode.env.openExternal(vscode.Uri.file(outputPath));
          logger.info('PDF opened in external viewer');
        }
      },
      true // Enable cancellation
    );

    logger.info('Export to PDF command completed successfully');

  } catch (error) {
    const errorMessage = 'Failed to export PDF';
    logger.error(errorMessage, error as Error);
    vscode.window.showErrorMessage(`${errorMessage}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Register the export PDF command
 */
export function registerExportPdfCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'vsprint.exportPdf',
    exportPdfCommand
  );

  context.subscriptions.push(disposable);
  logger.info('Export PDF command registered');
}
