import { FileMetadata } from '../commands/printFile';
import { PrintSettings } from '../config/settings';

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
 * Generate CSS styles for the print document
 *
 * @param settings - Print settings from user configuration
 * @returns CSS string
 */
function generateStyles(settings: PrintSettings): string {
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
        color: #000;
        background: #fff;
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
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: inherit;
        font-size: inherit;
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
 * @returns HTML string for code table
 */
function generateCodeTable(content: string, settings: PrintSettings): string {
  const lines = content.split('\n');
  let html = '<table class="code-container">\n';

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const escapedLine = escapeHtml(line);

    if (settings.showLineNumbers) {
      html += `  <tr>
    <td class="line-number">${lineNumber}</td>
    <td class="code-line"><pre>${escapedLine}</pre></td>
  </tr>\n`;
    } else {
      html += `  <tr>
    <td class="code-line"><pre>${escapedLine}</pre></td>
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
export function generatePrintHtml(
  content: string,
  metadata: FileMetadata,
  settings: PrintSettings
): string {
  const styles = generateStyles(settings);
  const header = generateHeader(metadata);
  const codeTable = generateCodeTable(content, settings);
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
