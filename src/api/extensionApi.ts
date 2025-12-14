import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { generatePrintHtml } from '../renderers/htmlRenderer';
import { getSettings, PrintSettings } from '../config/settings';
import { printHtml } from '../renderers/printerRenderer';
import { FileMetadata } from '../commands/printFile';
import { codeIntelligence } from '../services/codeIntelligence';

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

/**
 * Create the VSPrint API instance
 */
export function createVSprintApi(): VSprintApi {
  return {
    async print(options: PrintOptions = {}): Promise<string | void> {
      logger.info('VSPrint API: print() called', options);

      try {
        // Resolve content and metadata
        const { content, metadata, settings } = await resolveContentAndMetadata(options, options.settings);

        // Generate HTML (with empty arrays for symbolBoundaries and foldedRanges for simple print)
        const html = await generatePrintHtml(content, metadata, settings, [], []);
        logger.info(`VSPrint API: Generated HTML (${html.length} bytes)`);

        // Show dialog or return HTML
        const showDialog = options.showDialog !== false;
        if (showDialog) {
          await printHtml(html, metadata.fileName);
          logger.info('VSPrint API: Print dialog shown');
          return;
        } else {
          logger.info('VSPrint API: Returning HTML without dialog');
          return html;
        }
      } catch (error) {
        logger.error('VSPrint API: print() failed', error as Error);
        throw error;
      }
    },

    async getPreview(options: PreviewOptions = {}): Promise<PreviewResult> {
      logger.info('VSPrint API: getPreview() called', options);

      try {
        // Resolve content and metadata
        const { content, metadata, settings } = await resolveContentAndMetadata(options, options.settings);

        // Analyze symbols for separators
        let symbolBoundaries: number[] = [];
        if (settings.showSeparators) {
          symbolBoundaries = await codeIntelligence.getSymbolBoundaries(metadata.uri);
        }

        // Get folding ranges
        let foldedRanges = settings.foldedRegions !== 'expand'
          ? await codeIntelligence.getFoldedRanges(metadata.uri, settings.foldedRegions)
          : [];

        // Generate HTML
        const html = await generatePrintHtml(content, metadata, settings, symbolBoundaries, foldedRanges);

        // Estimate page count (rough: ~50 lines per page)
        const pageCount = Math.max(1, Math.ceil(content.split('\n').length / 50));

        logger.info(`VSPrint API: Preview generated (${html.length} bytes, ~${pageCount} pages)`);

        return {
          html,
          pageCount,
          metadata
        };
      } catch (error) {
        logger.error('VSPrint API: getPreview() failed', error as Error);
        throw error;
      }
    }
  };
}

/**
 * Resolve content and metadata from options
 * Handles various input scenarios and merges settings
 */
async function resolveContentAndMetadata(
  options: PrintOptions | PreviewOptions,
  settingsOverride?: Partial<PrintSettings>
): Promise<{ content: string; metadata: FileMetadata; settings: PrintSettings }> {
  let document: vscode.TextDocument | undefined;
  let content: string;
  let uri: vscode.Uri;
  let languageId: string;
  let fileName: string;

  // Determine source: explicit content, URI, or active editor
  if (options.content) {
    // Explicit content provided
    content = options.content;
    languageId = options.languageId || 'plaintext';
    fileName = options.fileName || 'untitled';
    uri = options.uri || vscode.Uri.parse('untitled:untitled');
  } else if (options.uri) {
    // URI provided - load document
    document = await vscode.workspace.openTextDocument(options.uri);
    content = document.getText();
    languageId = options.languageId || document.languageId;
    fileName = options.fileName || options.uri.path.split('/').pop() || 'untitled';
    uri = options.uri;
  } else {
    // Use active editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error('No active file and no URI or content provided');
    }
    document = editor.document;
    content = document.getText();
    languageId = options.languageId || document.languageId;
    fileName = options.fileName || document.fileName.split(/[\\/]/).pop() || 'untitled';
    uri = document.uri;
  }

  // Build metadata
  const metadata: FileMetadata = {
    fileName,
    filePath: vscode.workspace.asRelativePath(uri),
    languageId,
    lineCount: content.split('\n').length,
    content,
    uri
  };

  // Merge settings
  const baseSettings = getSettings();
  const settings: PrintSettings = settingsOverride
    ? { ...baseSettings, ...settingsOverride }
    : baseSettings;

  return { content, metadata, settings };
}
