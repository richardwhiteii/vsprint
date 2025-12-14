import { FileMetadata } from '../commands/printFile';
import { PrintSettings } from '../config/settings';
import { syntaxHighlighter } from '../services/syntaxHighlighter';
import { visualizeWhitespace } from '../utils/textTransform';

/**
 * Escape HTML entities to prevent XSS and rendering issues
 *
 * @param text - Raw text to escape
 * @returns HTML-safe text
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
 * Get CSS white-space styles based on line wrap mode
 *
 * @param lineWrap - Line wrap mode: 'none' | 'soft' | 'hard'
 * @returns CSS white-space and word-wrap properties
 */
function getWhiteSpaceStyles(lineWrap: 'none' | 'soft' | 'hard'): string {
  switch (lineWrap) {
    case 'none':
      return 'white-space: pre; overflow-x: auto;';
    case 'soft':
      return 'white-space: pre-wrap; word-wrap: break-word;';
    case 'hard':
      return 'white-space: pre-wrap; word-break: break-all;';
    default:
      return 'white-space: pre-wrap; word-wrap: break-word;';
  }
}

/**
 * Generate CSS styles for the print document
 *
 * @param settings - Print settings from user configuration
 * @param backgroundColor - Background color from theme
 * @param foregroundColor - Foreground color from theme
 * @returns CSS string
 */
function generateStyles(settings: PrintSettings, backgroundColor: string, foregroundColor: string): string {
  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: ${settings.fontFamily};
        font-size: ${settings.fontSize}pt;
        line-height: 1.5;
        color: ${foregroundColor};
        background: ${backgroundColor};
      }

      .header {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #ccc;
      }

      .header h1 {
        font-size: ${settings.fontSize + 4}pt;
        margin-bottom: 5px;
      }

      .header .metadata {
        font-size: ${settings.fontSize - 1}pt;
        color: #666;
      }

      .code-container {
        width: 100%;
        border-collapse: collapse;
      }

      .line-number {
        text-align: right;
        padding-right: 10px;
        color: #999;
        border-right: 1px solid #ccc;
        user-select: none;
        vertical-align: top;
        width: 50px;
      }

      .code-line {
        padding-left: 10px;
        vertical-align: top;
      }

      .code-line pre {
        margin: 0;
        padding: 0;
        ${getWhiteSpaceStyles(settings.lineWrap)}
        font-family: inherit;
        font-size: inherit;
      }

      .ws-space, .ws-tab {
        color: #ccc;
        font-weight: normal;
      }

      .footer {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #ccc;
        text-align: center;
        font-size: ${settings.fontSize - 1}pt;
        color: #666;
      }

      @media print {
        @page {
          margin: 1in;
        }

        body {
          background: none;
        }

        .header, .footer {
          page-break-inside: avoid;
        }

        tr {
          page-break-inside: avoid;
        }
      }
    </style>
  `;
}

/**
 * Generate header HTML with file metadata
 *
 * @param metadata - File metadata
 * @returns HTML string for header
 */
function generateHeader(metadata: FileMetadata): string {
  return `
    <div class="header">
      <h1>${escapeHtml(metadata.fileName)}</h1>
      <div class="metadata">
        <strong>Path:</strong> ${escapeHtml(metadata.filePath)} |
        <strong>Language:</strong> ${escapeHtml(metadata.languageId)} |
        <strong>Lines:</strong> ${metadata.lineCount}
      </div>
    </div>
  `;
}

/**
 * Generate footer HTML with page placeholder
 *
 * @returns HTML string for footer
 */
function generateFooter(): string {
  return `
    <div class="footer">
      <p>Page <span class="page-number"></span></p>
    </div>
  `;
}

/**
 * Generate code table HTML with optional line numbers
 *
 * @param content - Code content to render
 * @param settings - Print settings
 * @param isPreHighlighted - Whether content is already HTML (syntax highlighted)
 * @returns HTML string for code table
 */
function generateCodeTable(content: string, settings: PrintSettings, isPreHighlighted: boolean = false): string {
  // Apply whitespace visualization if enabled and content is pre-highlighted
  let processedContent = content;
  if (isPreHighlighted && settings.showWhitespace !== 'none') {
    processedContent = visualizeWhitespace(content, settings.showWhitespace);
  }

  const lines = processedContent.split('\n');
  let html = '<table class="code-container">\n';

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    // Only escape if not pre-highlighted
    const lineContent = isPreHighlighted ? line : escapeHtml(line);

    if (settings.showLineNumbers) {
      html += `  <tr>
    <td class="line-number">${lineNumber}</td>
    <td class="code-line"><pre>${lineContent}</pre></td>
  </tr>\n`;
    } else {
      html += `  <tr>
    <td class="code-line"><pre>${lineContent}</pre></td>
  </tr>\n`;
    }
  });

  html += '</table>';
  return html;
}

/**
 * Generate complete print-ready HTML document
 *
 * @param content - Code content to render
 * @param metadata - File metadata
 * @param settings - Print settings from user configuration
 * @returns Complete HTML document string
 */
export async function generatePrintHtml(
  content: string,
  metadata: FileMetadata,
  settings: PrintSettings
): Promise<string> {
  // Get theme colors
  const backgroundColor = await syntaxHighlighter.getThemeBackground(settings.theme);
  const foregroundColor = await syntaxHighlighter.getThemeForeground(settings.theme);

  // Apply syntax highlighting
  const highlightedCode = await syntaxHighlighter.highlight(content, metadata.languageId, settings.theme);

  const styles = generateStyles(settings, backgroundColor, foregroundColor);
  const header = generateHeader(metadata);
  const codeTable = generateCodeTable(highlightedCode, settings, true);
  const footer = generateFooter();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metadata.fileName)} - Print</title>
  ${styles}
</head>
<body>
  ${header}
  ${codeTable}
  ${footer}
</body>
</html>`;
}
