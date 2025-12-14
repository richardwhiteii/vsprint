import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from '../utils/logger';
import { getSettings } from '../config/settings';
import { printHtml } from '../renderers/printerRenderer';
import { marked } from 'marked';
import { syntaxHighlighter } from '../services/syntaxHighlighter';

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, (char) => entityMap[char]);
}

/**
 * Read and base64 encode a local image file
 */
async function embedLocalImage(imagePath: string, baseDir: string): Promise<string | null> {
  try {
    // Resolve relative paths
    const absolutePath = path.isAbsolute(imagePath)
      ? imagePath
      : path.join(baseDir, imagePath);

    // Read image file
    const imageBuffer = await fs.readFile(absolutePath);
    const base64Data = imageBuffer.toString('base64');

    // Determine MIME type from extension
    const ext = path.extname(absolutePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp'
    };

    const mimeType = mimeTypes[ext] || 'image/png';
    return `data:${mimeType};base64,${base64Data}`;

  } catch (error) {
    logger.warn(`Failed to embed image: ${imagePath}`);
    return null;
  }
}

/**
 * Extract code blocks from markdown
 */
function extractCodeBlocks(markdown: string): Array<{ code: string; language: string; placeholder: string }> {
  const codeBlocks: Array<{ code: string; language: string; placeholder: string }> = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const language = match[1] || 'plaintext';
    const code = match[2];
    const placeholder = `__CODE_BLOCK_${Math.random().toString(36).substr(2, 9)}__`;
    codeBlocks.push({ code, language, placeholder });
  }

  return codeBlocks;
}

/**
 * Process markdown content with syntax highlighting for code blocks
 */
async function processMarkdown(
  markdown: string,
  theme: string,
  baseDir: string,
  embedImagesFlag: boolean
): Promise<string> {
  // Clear previous blocks/images
  codeBlocks.length = 0;
  images.length = 0;

  // Configure marked with custom renderer
  marked.use({
    renderer: customRenderer,
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert \n to <br>
  });

  // Parse markdown to HTML
  let html = await marked.parse(markdown);

  // Process code blocks with syntax highlighting
  for (const block of codeBlocks) {
    try {
      const highlighted = await syntaxHighlighter.highlight(
        block.code,
        block.language,
        theme
      );
      html = html.replace(block.placeholder, highlighted);
    } catch (error) {
      // Fallback to escaped code if highlighting fails
      logger.warn(`Failed to highlight code block (${block.language})`);
      html = html.replace(block.placeholder, escapeHtml(block.code));
    }
  }

  // Process images with embedding
  if (embedImagesFlag) {
    for (const img of images) {
      const embeddedSrc = await embedLocalImage(img.href, baseDir);
      if (embeddedSrc) {
        html = html.replace(img.placeholder, embeddedSrc);
      } else {
        // Keep original path if embedding fails
        html = html.replace(img.placeholder, escapeHtml(img.href));
      }
    }
  }

  return html;
}

/**
 * Generate CSS styles for markdown rendering
 */
function generateMarkdownStyles(
  fontSize: number,
  fontFamily: string,
  backgroundColor: string,
  foregroundColor: string
): string {
  return `
    <style>
      :root {
        --markdown-bg: ${backgroundColor};
        --markdown-fg: ${foregroundColor};
        --markdown-border: #ddd;
        --markdown-code-bg: #f5f5f5;
        --markdown-quote-border: #ddd;
        --markdown-link: #0366d6;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        font-size: ${fontSize}pt;
        line-height: 1.6;
        color: var(--markdown-fg);
        background: var(--markdown-bg);
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
      }

      h1, h2, h3, h4, h5, h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        line-height: 1.25;
      }

      h1 {
        font-size: ${fontSize + 10}pt;
        border-bottom: 1px solid var(--markdown-border);
        padding-bottom: 8px;
      }

      h2 {
        font-size: ${fontSize + 6}pt;
        border-bottom: 1px solid var(--markdown-border);
        padding-bottom: 6px;
      }

      h3 {
        font-size: ${fontSize + 4}pt;
      }

      h4 {
        font-size: ${fontSize + 2}pt;
      }

      h5, h6 {
        font-size: ${fontSize}pt;
      }

      p {
        margin-bottom: 16px;
      }

      a {
        color: var(--markdown-link);
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      ul, ol {
        margin-bottom: 16px;
        padding-left: 2em;
      }

      li {
        margin-bottom: 4px;
      }

      blockquote {
        margin: 16px 0;
        padding: 0 1em;
        color: #6a737d;
        border-left: 4px solid var(--markdown-quote-border);
      }

      code {
        font-family: ${fontFamily};
        font-size: ${fontSize - 1}pt;
        background: var(--markdown-code-bg);
        padding: 2px 6px;
        border-radius: 3px;
      }

      pre {
        margin-bottom: 16px;
        padding: 16px;
        background: var(--markdown-code-bg);
        border-radius: 6px;
        overflow-x: auto;
      }

      pre code {
        font-family: ${fontFamily};
        font-size: ${fontSize - 1}pt;
        background: transparent;
        padding: 0;
        white-space: pre;
        word-wrap: normal;
      }

      pre.code-block {
        border: 1px solid var(--markdown-border);
      }

      table {
        margin-bottom: 16px;
        border-collapse: collapse;
        width: 100%;
      }

      table th,
      table td {
        padding: 8px 13px;
        border: 1px solid var(--markdown-border);
      }

      table th {
        background: var(--markdown-code-bg);
        font-weight: 600;
      }

      table tr:nth-child(even) {
        background: #f6f8fa;
      }

      img {
        max-width: 100%;
        height: auto;
        margin: 16px 0;
        border: 1px solid var(--markdown-border);
      }

      hr {
        margin: 24px 0;
        border: 0;
        border-top: 1px solid var(--markdown-border);
      }

      .markdown-footer {
        margin-top: 40px;
        padding-top: 16px;
        border-top: 1px solid var(--markdown-border);
        text-align: center;
        font-size: ${fontSize - 2}pt;
        color: #6a737d;
      }

      @media print {
        @page {
          margin: 1in;
        }

        body {
          background: none;
          max-width: none;
          margin: 0;
          padding: 0;
        }

        a {
          color: inherit;
          text-decoration: underline;
        }

        pre, blockquote {
          page-break-inside: avoid;
        }

        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
        }
      }
    </style>
  `;
}

/**
 * Command handler for printing rendered markdown
 */
export async function printMarkdownCommand(): Promise<void> {
  logger.info('Print Markdown command invoked');

  // Get the active text editor
  const editor = vscode.window.activeTextEditor;

  // Handle case when no file is open
  if (!editor) {
    const errorMessage = 'No active file to print. Please open a markdown file first.';
    logger.warn(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
    return;
  }

  const document = editor.document;

  // Verify this is a markdown file
  if (document.languageId !== 'markdown' && !document.fileName.endsWith('.md')) {
    const errorMessage = 'Active file is not a markdown file. Please open a .md file.';
    logger.warn(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
    return;
  }

  try {
    // Get markdown content
    const markdownContent = document.getText();
    const fileName = document.fileName.split(/[\\/]/).pop() || 'document.md';
    const baseDir = path.dirname(document.uri.fsPath);

    logger.info(`Rendering markdown: ${fileName}`);

    // Get user settings
    const settings = getSettings();
    logger.info(`Settings loaded: fontSize=${settings.fontSize}, theme=${settings.theme}`);

    // Get markdown-specific settings
    const embedImages = settings.markdown?.embedImages ?? true;

    // Get theme colors
    const backgroundColor = await syntaxHighlighter.getThemeBackground(settings.theme);
    const foregroundColor = await syntaxHighlighter.getThemeForeground(settings.theme);

    // Process markdown with syntax highlighting
    const renderedContent = await processMarkdown(
      markdownContent,
      settings.theme,
      baseDir,
      embedImages
    );

    // Generate styles
    const styles = generateMarkdownStyles(
      settings.fontSize,
      settings.fontFamily,
      backgroundColor,
      foregroundColor
    );

    // Build complete HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fileName)} - Markdown</title>
  ${styles}
</head>
<body>
  ${renderedContent}
  <div class="markdown-footer">
    Generated by VSPrint
  </div>
</body>
</html>`;

    logger.info(`Markdown HTML generated successfully (${html.length} bytes)`);

    // Print via browser
    await printHtml(html, fileName);

    logger.info('Print Markdown command completed successfully');

  } catch (error) {
    const errorMessage = 'Failed to print markdown';
    logger.error(errorMessage, error as Error);
    vscode.window.showErrorMessage(`${errorMessage}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Register the print markdown command
 */
export function registerPrintMarkdownCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'vsprint.printMarkdown',
    printMarkdownCommand
  );

  context.subscriptions.push(disposable);
  logger.info('Print Markdown command registered');
}
