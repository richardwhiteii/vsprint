import { PrintSettings } from '../config/settings';
import { BlameInformation, BlameLine } from '../commands/printWithBlame';
import { syntaxHighlighter } from '../services/syntaxHighlighter';

/**
 * File metadata for blame rendering
 */
interface BlameFileMetadata {
  fileName: string;
  filePath: string;
  languageId: string;
  lineCount: number;
}

/**
 * Escape HTML entities to prevent XSS and rendering issues
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
 * Generate a consistent color for an author name
 * Uses a simple hash to generate a hue value
 */
function getAuthorColor(authorName: string): string {
  let hash = 0;
  for (let i = 0; i < authorName.length; i++) {
    hash = authorName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate a hue between 0-360, with saturation and lightness optimized for readability
  const hue = Math.abs(hash % 360);
  const saturation = 45; // Moderate saturation for subtle colors
  const lightness = 85; // High lightness for background colors

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Format date as relative time (e.g., "2 days ago")
 */
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
  return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`;
}

/**
 * Format date as absolute date (e.g., "2024-01-15")
 */
function formatAbsoluteDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate CSS styles for blame rendering
 */
function generateBlameStyles(settings: PrintSettings, backgroundColor: string, foregroundColor: string): string {
  return `
    <style>
      /* CSS Variable Hooks */
      :root {
        --vsprint-bg-color: ${backgroundColor};
        --vsprint-text-color: ${foregroundColor};
        --vsprint-line-number-color: #999;
        --vsprint-border-color: #ccc;
        --vsprint-blame-bg: #f5f5f5;
        --vsprint-blame-text: #666;
        --vsprint-font-size: ${settings.fontSize}pt;
        --vsprint-code-font: ${settings.fontFamily};
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: var(--vsprint-code-font);
        font-size: var(--vsprint-font-size);
        line-height: 1.5;
        color: var(--vsprint-text-color);
        background: var(--vsprint-bg-color);
        padding: 20px;
      }

      .blame-header {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid var(--vsprint-border-color);
      }

      .blame-header h1 {
        font-size: ${settings.fontSize + 4}pt;
        margin-bottom: 5px;
      }

      .blame-header .metadata {
        font-size: ${settings.fontSize - 1}pt;
        color: #666;
      }

      .blame-container {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--vsprint-code-font);
      }

      .blame-container td {
        padding: 2px 8px;
        vertical-align: top;
      }

      .blame-annotation {
        font-size: ${settings.fontSize - 1}pt;
        white-space: nowrap;
        text-align: left;
        border-right: 1px solid var(--vsprint-border-color);
        user-select: none;
        min-width: 200px;
        max-width: 250px;
      }

      .blame-author {
        font-weight: 600;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #333;
      }

      .blame-date {
        font-size: ${settings.fontSize - 2}pt;
        color: var(--vsprint-blame-text);
        display: block;
      }

      .line-number {
        text-align: right;
        padding-right: 10px;
        color: var(--vsprint-line-number-color);
        border-right: 1px solid var(--vsprint-border-color);
        user-select: none;
        width: 50px;
      }

      .code-line {
        padding-left: 10px;
        white-space: pre;
        font-family: inherit;
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
        border-top: 1px solid var(--vsprint-border-color);
        text-align: center;
        font-size: ${settings.fontSize - 1}pt;
        color: #666;
      }

      @media print {
        @page {
          margin: 0.5in;
        }

        body {
          background: none;
          padding: 0;
        }

        .blame-header, .footer {
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
 * Generate header HTML
 */
function generateBlameHeader(metadata: BlameFileMetadata): string {
  return `
    <div class="blame-header">
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
 * Generate footer HTML
 */
function generateFooter(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  return `
    <div class="footer">
      <p>Generated by VSPrint with Git Blame - ${dateStr} ${timeStr}</p>
    </div>
  `;
}

/**
 * Generate blame table HTML with code and annotations
 */
function generateBlameTable(
  highlightedCode: string,
  blameInfo: BlameInformation,
  settings: PrintSettings
): string {
  const lines = highlightedCode.split('\n');
  const blameSettings = settings.blame || {
    showAuthor: true,
    showDate: true,
    dateFormat: 'relative'
  };

  // Create a map of line numbers to blame lines
  const blameMap = new Map<number, BlameLine>();
  for (const blameLine of blameInfo.lines) {
    blameMap.set(blameLine.line, blameLine);
  }

  // Track author colors for consistency
  const authorColors = new Map<string, string>();

  let html = '<table class="blame-container">\n';

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const blameLine = blameMap.get(lineNumber);

    // Generate blame annotation
    let blameAnnotation = '';
    let backgroundColor = 'transparent';

    if (blameLine && (blameSettings.showAuthor || blameSettings.showDate)) {
      const authorName = blameLine.author.name;

      // Get or generate author color
      if (!authorColors.has(authorName)) {
        authorColors.set(authorName, getAuthorColor(authorName));
      }
      backgroundColor = authorColors.get(authorName) || 'transparent';

      let authorHtml = '';
      let dateHtml = '';

      if (blameSettings.showAuthor) {
        authorHtml = `<span class="blame-author" title="${escapeHtml(authorName)}">${escapeHtml(authorName)}</span>`;
      }

      if (blameSettings.showDate) {
        const formattedDate = blameSettings.dateFormat === 'relative'
          ? formatRelativeDate(blameLine.author.date)
          : formatAbsoluteDate(blameLine.author.date);
        dateHtml = `<span class="blame-date">${escapeHtml(formattedDate)}</span>`;
      }

      blameAnnotation = `${authorHtml}${dateHtml}`;
    }

    // Build table row
    if (settings.showLineNumbers) {
      html += `  <tr>
    <td class="blame-annotation" style="background-color: ${backgroundColor}">${blameAnnotation}</td>
    <td class="line-number">${lineNumber}</td>
    <td class="code-line"><pre>${line}</pre></td>
  </tr>\n`;
    } else {
      html += `  <tr>
    <td class="blame-annotation" style="background-color: ${backgroundColor}">${blameAnnotation}</td>
    <td class="code-line"><pre>${line}</pre></td>
  </tr>\n`;
    }
  });

  html += '</table>\n';
  return html;
}

/**
 * Generate complete blame HTML document
 */
export async function generateBlameHtml(
  content: string,
  blameInfo: BlameInformation,
  metadata: BlameFileMetadata,
  settings: PrintSettings
): Promise<string> {
  // Get theme colors
  const backgroundColor = await syntaxHighlighter.getThemeBackground(settings.theme);
  const foregroundColor = await syntaxHighlighter.getThemeForeground(settings.theme);

  // Apply syntax highlighting
  const highlightedCode = await syntaxHighlighter.highlight(content, metadata.languageId, settings.theme);

  // Generate HTML components
  const styles = generateBlameStyles(settings, backgroundColor, foregroundColor);
  const header = generateBlameHeader(metadata);
  const blameTable = generateBlameTable(highlightedCode, blameInfo, settings);
  const footer = generateFooter();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metadata.fileName)} - Blame</title>
  ${styles}
</head>
<body>
  ${header}
  ${blameTable}
  ${footer}
</body>
</html>`;
}
