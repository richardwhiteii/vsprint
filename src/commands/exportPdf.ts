import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { generatePrintHtml } from '../renderers/htmlRenderer';
import { renderToPdf, PdfOptions, validatePdfOptions } from '../renderers/pdfRenderer';
import { getSettings } from '../config/settings';
import { FileMetadata } from './printFile';

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
    content: document.getText()
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

    // Show progress notification
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Exporting to PDF',
        cancellable: false
      },
      async (progress) => {
        // Step 1: Generate HTML
        progress.report({ message: 'Generating HTML...', increment: 20 });
        const html = await generatePrintHtml(metadata.content, metadata, settings);
        logger.info(`HTML generated successfully (${html.length} bytes)`);

        // Step 2: Convert to PDF
        progress.report({ message: 'Converting to PDF...', increment: 40 });
        const pdfBuffer = await renderToPdf(html, pdfOptions);
        logger.info(`PDF buffer created (${pdfBuffer.length} bytes)`);

        // Step 3: Save to file
        progress.report({ message: 'Saving PDF file...', increment: 30 });
        await savePdfToFile(pdfBuffer, outputPath);
        logger.info(`PDF saved to: ${outputPath}`);

        // Complete
        progress.report({ message: 'Complete!', increment: 10 });
      }
    );

    // Show success message with option to open the file
    const openAction = 'Open PDF';
    const result = await vscode.window.showInformationMessage(
      `PDF exported successfully to ${path.basename(outputPath)}`,
      openAction
    );

    // Open PDF if user clicked the action
    if (result === openAction) {
      await vscode.env.openExternal(vscode.Uri.file(outputPath));
      logger.info('PDF opened in external viewer');
    }

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
