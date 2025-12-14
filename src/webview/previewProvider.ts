import * as vscode from 'vscode';
import * as path from 'path';
import { logger } from '../utils/logger';
import { generatePrintHtml } from '../renderers/htmlRenderer';
import { FileMetadata } from '../commands/printFile';
import { getSettings } from '../config/settings';
import { codeIntelligence, FoldRange } from '../services/codeIntelligence';

/**
 * WebView Preview Provider
 * Implements VS Code WebviewViewProvider to show live print preview
 */
export class PreviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'vsprint.preview';

  private _view?: vscode.WebviewView;
  private _currentZoom: number = 100;
  private _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
    logger.info('PreviewProvider initialized');
  }

  /**
   * Resolve WebView view
   * Called when the view is first opened
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    // Configure webview options
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'src', 'webview')
      ]
    };

    // Set initial HTML
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      async (message: any) => {
        switch (message.type) {
          case 'zoom':
            this._currentZoom = message.value;
            logger.info(`Zoom changed to ${this._currentZoom}%`);
            break;

          case 'print':
            logger.info('Print requested from preview');
            await vscode.commands.executeCommand('vsprint.printFile');
            break;

          case 'exportPdf':
            logger.info('Export PDF requested from preview');
            await vscode.commands.executeCommand('vsprint.exportPdf');
            break;

          case 'refresh':
            logger.info('Refresh requested from preview');
            await this.refresh();
            break;

          case 'ready':
            // WebView is ready, send initial content
            logger.info('WebView ready, sending initial content');
            await this.refresh();
            break;
        }
      },
      undefined,
      this._disposables
    );

    // Listen for document changes
    this._disposables.push(
      vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
        if (e.document === vscode.window.activeTextEditor?.document) {
          // Debounce refresh to avoid excessive updates
          this._debounceRefresh();
        }
      })
    );

    // Listen for active editor changes
    this._disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.refresh();
      })
    );

    logger.info('WebView view resolved successfully');
  }

  private _refreshTimeout?: NodeJS.Timeout;

  /**
   * Debounce refresh to avoid excessive updates
   */
  private _debounceRefresh(): void {
    if (this._refreshTimeout) {
      clearTimeout(this._refreshTimeout);
    }

    this._refreshTimeout = setTimeout(() => {
      this.refresh();
    }, 500);
  }

  /**
   * Refresh preview content
   */
  public async refresh(): Promise<void> {
    if (!this._view) {
      return;
    }

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        // Show empty state
        this._view.webview.postMessage({
          type: 'update',
          html: '<div class="empty-state">No file open</div>',
          pageCount: 0
        });
        return;
      }

      const document = editor.document;

      // Generate preview HTML
      const previewHtml = await this._generatePreviewContent(document);

      // Send update to webview
      this._view.webview.postMessage({
        type: 'update',
        html: previewHtml,
        pageCount: this._estimatePageCount(document.getText())
      });

      logger.info('Preview refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh preview', error as Error);
      this._view.webview.postMessage({
        type: 'error',
        message: `Preview error: ${(error as Error).message}`
      });
    }
  }

  /**
   * Generate preview content HTML
   */
  private async _generatePreviewContent(document: vscode.TextDocument): Promise<string> {
    const content = document.getText();
    const settings = getSettings();

    // Build metadata
    const metadata: FileMetadata = {
      fileName: path.basename(document.uri.fsPath),
      filePath: vscode.workspace.asRelativePath(document.uri),
      languageId: document.languageId,
      lineCount: document.lineCount,
      content: content,
      uri: document.uri
    };

    // Analyze symbols for separators
    let symbolBoundaries: number[] = [];
    if (settings.showSeparators) {
      symbolBoundaries = await codeIntelligence.getSymbolBoundaries(document.uri);
    }

    // Get folding ranges
    let foldedRanges: FoldRange[] = [];
    if (settings.foldedRegions === 'collapse') {
      foldedRanges = await codeIntelligence.getFoldedRanges(document.uri, settings.foldedRegions);
    }

    // Generate full HTML
    const fullHtml = await generatePrintHtml(
      content,
      metadata,
      settings,
      symbolBoundaries,
      foldedRanges
    );

    // Extract body content only (we'll use our own wrapper)
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      return bodyMatch[1];
    }

    return fullHtml;
  }

  /**
   * Estimate page count based on content length
   * Rough estimation: ~50 lines per page
   */
  private _estimatePageCount(content: string): number {
    const lines = content.split('\n').length;
    return Math.max(1, Math.ceil(lines / 50));
  }

  /**
   * Get HTML for webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get URIs for resources
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'preview.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'preview.js')
    );

    // Use a nonce for security
    const nonce = this._getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;">
  <link rel="stylesheet" href="${styleUri}">
  <title>Print Preview</title>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-section">
      <button id="zoomOut" class="toolbar-btn" title="Zoom Out">-</button>
      <span id="zoomLevel" class="zoom-display">100%</span>
      <button id="zoomIn" class="toolbar-btn" title="Zoom In">+</button>
    </div>

    <div class="toolbar-section">
      <button id="zoom50" class="toolbar-btn-small" title="50%">50%</button>
      <button id="zoom75" class="toolbar-btn-small" title="75%">75%</button>
      <button id="zoom100" class="toolbar-btn-small" title="100%">100%</button>
      <button id="zoom125" class="toolbar-btn-small" title="125%">125%</button>
      <button id="zoom150" class="toolbar-btn-small" title="150%">150%</button>
      <button id="zoom200" class="toolbar-btn-small" title="200%">200%</button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-section">
      <span id="pageInfo" class="page-info">Page 1 of 1</span>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-section">
      <button id="refreshBtn" class="toolbar-btn" title="Refresh Preview">⟳</button>
      <button id="printBtn" class="toolbar-btn" title="Print">🖨</button>
      <button id="exportPdfBtn" class="toolbar-btn" title="Export PDF">📄</button>
    </div>
  </div>

  <div class="preview-container" id="preview">
    <div class="loading-state">Loading preview...</div>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Generate a nonce for CSP
   */
  private _getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }

    if (this._refreshTimeout) {
      clearTimeout(this._refreshTimeout);
    }
  }
}
