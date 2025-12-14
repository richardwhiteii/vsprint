import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { getTempFilePath, writeTempFile } from '../utils/tempFile';

/**
 * Singleton class to manage temp files created for printing
 */
class TempFileTracker {
  private static instance: TempFileTracker;
  private tempFiles: string[] = [];

  private constructor() {}

  static getInstance(): TempFileTracker {
    if (!TempFileTracker.instance) {
      TempFileTracker.instance = new TempFileTracker();
    }
    return TempFileTracker.instance;
  }

  addFile(filePath: string): void {
    this.tempFiles.push(filePath);
  }

  getFiles(): string[] {
    return [...this.tempFiles];
  }

  clear(): void {
    this.tempFiles = [];
  }
}

/**
 * Get the platform-specific keyboard shortcut for printing
 */
function getPrintShortcut(): string {
  const platform = process.platform;
  return platform === 'darwin' ? 'Cmd+P' : 'Ctrl+P';
}

/**
 * Print HTML content by opening it in the default browser
 * The browser's print dialog handles the actual printing
 *
 * @param html - HTML content to print
 * @param fileName - Name of the file being printed (for user message)
 * @throws Error if browser fails to open
 */
export async function printHtml(html: string, fileName: string): Promise<void> {
  try {
    // Generate temp file path
    const tempFilePath = getTempFilePath('vsprint', '.html');
    logger.info(`Preparing to print via browser: ${tempFilePath}`);

    // Write HTML to temp file
    await writeTempFile(html, tempFilePath);

    // Track temp file for cleanup
    TempFileTracker.getInstance().addFile(tempFilePath);

    // Convert to file URI
    const fileUri = vscode.Uri.file(tempFilePath);

    // Open in default browser
    const opened = await vscode.env.openExternal(fileUri);

    if (!opened) {
      throw new Error('Failed to open browser');
    }

    // Show success message with print instructions
    const shortcut = getPrintShortcut();
    const message = `Print ready! Use ${shortcut} in your browser to print ${fileName}`;
    vscode.window.showInformationMessage(message);

    logger.info(`Browser opened successfully for printing: ${fileName}`);

  } catch (error) {
    logger.error('Failed to print via browser', error as Error);
    const errorMessage = `Failed to print: ${(error as Error).message}`;
    vscode.window.showErrorMessage(errorMessage);
    throw error;
  }
}

/**
 * Get all temp files created during this session
 *
 * @returns Array of temp file paths
 */
export function getTempFiles(): string[] {
  return TempFileTracker.getInstance().getFiles();
}

/**
 * Clear the temp file tracker (useful for cleanup after deletion)
 */
export function clearTempFileTracker(): void {
  TempFileTracker.getInstance().clear();
}
