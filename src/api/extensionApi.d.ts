import * as vscode from 'vscode';
import { PrintSettings } from '../config/settings';
import { FileMetadata } from '../commands/printFile';

/**
 * Print options for the public API
 */
export interface PrintOptions {
  /** URI of the file to print. If not provided, uses active editor */
  uri?: vscode.Uri;

  /** Content to print. If not provided, reads from URI or active editor */
  content?: string;

  /** Language ID for syntax highlighting. If not provided, inferred from file */
  languageId?: string;

  /** File name for display in header/footer. If not provided, uses URI filename */
  fileName?: string;

  /** Override print settings. Merged with user settings */
  settings?: Partial<PrintSettings>;

  /** Whether to show the print dialog (true) or return HTML (false). Default: true */
  showDialog?: boolean;
}

/**
 * Preview options for the public API
 */
export interface PreviewOptions {
  /** URI of the file to preview. If not provided, uses active editor */
  uri?: vscode.Uri;

  /** Content to preview. If not provided, reads from URI or active editor */
  content?: string;

  /** Language ID for syntax highlighting. If not provided, inferred from file */
  languageId?: string;

  /** File name for display. If not provided, uses URI filename */
  fileName?: string;

  /** Override print settings. Merged with user settings */
  settings?: Partial<PrintSettings>;
}

/**
 * Preview result returned by getPreview()
 */
export interface PreviewResult {
  /** Generated HTML content */
  html: string;

  /** Estimated page count */
  pageCount: number;

  /** Metadata about the printed content */
  metadata: FileMetadata;
}

/**
 * VSPrint Extension API
 * Public API for other extensions to use VSPrint functionality
 */
export interface VSprintApi {
  /**
   * Print a file or content with VSPrint
   *
   * @param options - Print options
   * @returns HTML string if showDialog is false, otherwise void
   *
   * @example
   * ```typescript
   * // Print active file with dialog
   * await vsprintApi.print();
   *
   * // Print specific file
   * await vsprintApi.print({ uri: vscode.Uri.file('/path/to/file.ts') });
   *
   * // Print custom content
   * await vsprintApi.print({
   *   content: 'console.log("Hello");',
   *   languageId: 'javascript',
   *   fileName: 'example.js'
   * });
   *
   * // Get HTML without showing dialog
   * const html = await vsprintApi.print({ showDialog: false });
   * ```
   */
  print(options?: PrintOptions): Promise<string | void>;

  /**
   * Generate a preview of print output
   *
   * @param options - Preview options
   * @returns Preview result with HTML and metadata
   *
   * @example
   * ```typescript
   * // Get preview of active file
   * const preview = await vsprintApi.getPreview();
   * console.log(preview.html);
   * console.log(`Estimated pages: ${preview.pageCount}`);
   *
   * // Get preview with custom settings
   * const preview = await vsprintApi.getPreview({
   *   settings: { fontSize: 12, showLineNumbers: false }
   * });
   * ```
   */
  getPreview(options?: PreviewOptions): Promise<PreviewResult>;
}
