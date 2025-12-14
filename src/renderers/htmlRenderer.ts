import { FileMetadata } from '../commands/printFile';
import { PrintSettings } from '../config/settings';
import { syntaxHighlighter } from '../services/syntaxHighlighter';
import { FoldRange } from '../services/codeIntelligence';

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

      .separator td {
        border-top: 2px solid #e0e0e0;
        padding-top: 8px;
      }

      .fold-placeholder {
        color: #999;
        font-style: italic;
        background-color: #f5f5f5;
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
 * @param symbolBoundaries - Line numbers where separators should be inserted
 * @returns HTML string for code table
 */
function generateCodeTable(
  content: string,
  settings: PrintSettings,
  isPreHighlighted: boolean = false,
  symbolBoundaries: number[] = []
): string {
  const lines = content.split('\n');
  const boundarySet = new Set(symbolBoundaries);
  let html = '<table class="code-container">\n';

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Insert separator row before this line if it's a symbol boundary
    if (boundarySet.has(lineNumber)) {
      if (settings.showLineNumbers) {
        html += `  <tr class="separator"><td colspan="2"></td></tr>\n`;
      } else {
        html += `  <tr class="separator"><td></td></tr>\n`;
      }
    }

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
 * Apply fold placeholders to content
 * Replaces folded regions with a single-line placeholder
 *
 * @param content - Code content to process
 * @param foldedRanges - Array of fold ranges to apply
 * @returns Content with fold placeholders applied
 */
function applyFoldPlaceholders(content: string, foldedRanges: FoldRange[]): string {
  if (foldedRanges.length === 0) return content;

  const lines = content.split('\n');
  const linesToRemove = new Set<number>();

  // Mark lines to remove (0-based indexing)
  for (const range of foldedRanges) {
    // Remove lines from start+1 to end (inclusive)
    for (let i = range.start + 1; i <= range.end; i++) {
      linesToRemove.add(i);
    }
  }

  // Build new content with placeholders
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    if (!linesToRemove.has(i)) {
      result.push(lines[i]);
      i++;
    } else {
      // Find the extent of consecutive removed lines (part of same fold)
      let start = i;
      while (i < lines.length && linesToRemove.has(i)) {
        i++;
      }
      const count = i - start;
      // Insert placeholder with count
      result.push(`<span class="fold-placeholder">/* ... ${count} lines collapsed ... */</span>`);
    }
  }

  return result.join('\n');
}

/**
 * Generate complete print-ready HTML document
 *
 * @param content - Code content to render
 * @param metadata - File metadata
 * @param settings - Print settings from user configuration
 * @param symbolBoundaries - Line numbers where separators should be inserted
 * @param foldedRanges - Folding ranges to apply
 * @returns Complete HTML document string
 */
export async function generatePrintHtml(
  content: string,
  metadata: FileMetadata,
  settings: PrintSettings,
  symbolBoundaries: number[] = [],
  foldedRanges: FoldRange[] = []
): Promise<string> {
  // Get theme colors
  const backgroundColor = await syntaxHighlighter.getThemeBackground(settings.theme);
  const foregroundColor = await syntaxHighlighter.getThemeForeground(settings.theme);

  // Apply fold placeholders before syntax highlighting
  const processedContent = applyFoldPlaceholders(content, foldedRanges);

  // Apply syntax highlighting
  const highlightedCode = await syntaxHighlighter.highlight(processedContent, metadata.languageId, settings.theme);

  const styles = generateStyles(settings, backgroundColor, foregroundColor);
  const header = generateHeader(metadata);
  const codeTable = generateCodeTable(highlightedCode, settings, true, symbolBoundaries);
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
