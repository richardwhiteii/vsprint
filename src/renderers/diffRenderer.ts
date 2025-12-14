import { PrintSettings } from '../config/settings';
import { DiffHunk, DiffLine } from '../commands/printDiff';

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
 * Generate CSS styles for diff rendering
 */
function generateDiffStyles(settings: PrintSettings): string {
  return `
    <style>
      /* CSS Variable Hooks */
      :root {
        --vsprint-diff-add-bg: #e6ffed;
        --vsprint-diff-add-text: #24292e;
        --vsprint-diff-delete-bg: #ffeef0;
        --vsprint-diff-delete-text: #24292e;
        --vsprint-diff-context-bg: #ffffff;
        --vsprint-diff-context-text: #24292e;
        --vsprint-diff-line-number-bg: #f6f8fa;
        --vsprint-diff-line-number-text: #57606a;
        --vsprint-diff-border-color: #d0d7de;
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
        color: var(--vsprint-diff-context-text);
        background: white;
        padding: 20px;
      }

      .diff-header {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid var(--vsprint-diff-border-color);
      }

      .diff-header h1 {
        font-size: ${settings.fontSize + 4}pt;
        margin-bottom: 5px;
        color: #24292e;
      }

      .diff-header .metadata {
        font-size: ${settings.fontSize - 1}pt;
        color: #57606a;
      }

      .diff-hunk {
        margin-bottom: 20px;
        border: 1px solid var(--vsprint-diff-border-color);
        border-radius: 6px;
        overflow: hidden;
      }

      .hunk-header {
        background-color: #f6f8fa;
        padding: 5px 10px;
        font-family: var(--vsprint-code-font);
        font-size: ${settings.fontSize - 1}pt;
        color: #57606a;
        border-bottom: 1px solid var(--vsprint-diff-border-color);
      }

      /* Unified diff styles */
      .diff-unified {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--vsprint-code-font);
      }

      .diff-unified td {
        padding: 0 5px;
        vertical-align: top;
        white-space: pre;
        font-family: var(--vsprint-code-font);
      }

      .diff-unified .line-number {
        width: 50px;
        text-align: right;
        background-color: var(--vsprint-diff-line-number-bg);
        color: var(--vsprint-diff-line-number-text);
        border-right: 1px solid var(--vsprint-diff-border-color);
        user-select: none;
      }

      .diff-unified .line-content {
        padding-left: 10px;
      }

      .diff-unified .add-line {
        background-color: var(--vsprint-diff-add-bg);
      }

      .diff-unified .delete-line {
        background-color: var(--vsprint-diff-delete-bg);
      }

      .diff-unified .context-line {
        background-color: var(--vsprint-diff-context-bg);
      }

      .diff-unified .line-marker {
        display: inline-block;
        width: 1em;
        color: #57606a;
      }

      /* Side-by-side diff styles */
      .diff-side-by-side {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      .diff-side-by-side td {
        padding: 0 5px;
        vertical-align: top;
        white-space: pre;
        font-family: var(--vsprint-code-font);
        width: 50%;
      }

      .diff-side-by-side .old-line-number,
      .diff-side-by-side .new-line-number {
        width: 50px;
        text-align: right;
        background-color: var(--vsprint-diff-line-number-bg);
        color: var(--vsprint-diff-line-number-text);
        border-right: 1px solid var(--vsprint-diff-border-color);
        user-select: none;
      }

      .diff-side-by-side .old-content,
      .diff-side-by-side .new-content {
        padding-left: 10px;
      }

      .diff-side-by-side .old-content {
        border-right: 1px solid var(--vsprint-diff-border-color);
      }

      .diff-side-by-side .delete-line-old {
        background-color: var(--vsprint-diff-delete-bg);
      }

      .diff-side-by-side .add-line-new {
        background-color: var(--vsprint-diff-add-bg);
      }

      .diff-side-by-side .context-line-old,
      .diff-side-by-side .context-line-new {
        background-color: var(--vsprint-diff-context-bg);
      }

      .diff-side-by-side .empty-line {
        background-color: #fafbfc;
      }

      .footer {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid var(--vsprint-diff-border-color);
        text-align: center;
        font-size: ${settings.fontSize - 1}pt;
        color: #57606a;
      }

      @media print {
        @page {
          margin: 1in;
        }

        body {
          background: none;
          padding: 0;
        }

        .diff-hunk {
          page-break-inside: avoid;
        }
      }
    </style>
  `;
}

/**
 * Generate diff header HTML
 */
function generateDiffHeader(fileName: string, filePath: string, diffType: string): string {
  return `
    <div class="diff-header">
      <h1>${escapeHtml(fileName)}</h1>
      <div class="metadata">
        <strong>Path:</strong> ${escapeHtml(filePath)} |
        <strong>Diff Type:</strong> ${escapeHtml(diffType)}
      </div>
    </div>
  `;
}

/**
 * Generate unified diff view for a hunk
 */
function generateUnifiedHunk(hunk: DiffHunk, settings: PrintSettings): string {
  let html = '<div class="diff-hunk">\n';

  // Hunk header
  html += `  <div class="hunk-header">@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@</div>\n`;

  // Diff table
  html += '  <table class="diff-unified">\n';

  for (const line of hunk.lines) {
    const lineClass = `${line.type}-line`;
    let lineNumber = '';
    let marker = '';

    if (line.type === 'add') {
      lineNumber = settings.showLineNumbers && line.newLineNumber ? String(line.newLineNumber) : '';
      marker = '+';
    } else if (line.type === 'delete') {
      lineNumber = settings.showLineNumbers && line.oldLineNumber ? String(line.oldLineNumber) : '';
      marker = '-';
    } else {
      lineNumber = settings.showLineNumbers && line.oldLineNumber ? String(line.oldLineNumber) : '';
      marker = ' ';
    }

    const content = escapeHtml(line.content);

    if (settings.showLineNumbers) {
      html += `    <tr class="${lineClass}">
      <td class="line-number">${lineNumber}</td>
      <td class="line-content"><span class="line-marker">${marker}</span>${content}</td>
    </tr>\n`;
    } else {
      html += `    <tr class="${lineClass}">
      <td class="line-content"><span class="line-marker">${marker}</span>${content}</td>
    </tr>\n`;
    }
  }

  html += '  </table>\n';
  html += '</div>\n';

  return html;
}

/**
 * Generate side-by-side diff view for a hunk
 */
function generateSideBySideHunk(hunk: DiffHunk, settings: PrintSettings): string {
  let html = '<div class="diff-hunk">\n';

  // Hunk header
  html += `  <div class="hunk-header">@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@</div>\n`;

  // Diff table
  html += '  <table class="diff-side-by-side">\n';

  // Process lines to align old and new versions
  let i = 0;
  while (i < hunk.lines.length) {
    const line = hunk.lines[i];

    if (line.type === 'context') {
      // Context line appears in both columns
      const oldLineNum = settings.showLineNumbers && line.oldLineNumber ? String(line.oldLineNumber) : '';
      const newLineNum = settings.showLineNumbers && line.newLineNumber ? String(line.newLineNumber) : '';
      const content = escapeHtml(line.content);

      if (settings.showLineNumbers) {
        html += `    <tr>
      <td class="old-line-number">${oldLineNum}</td>
      <td class="old-content context-line-old">${content}</td>
      <td class="new-line-number">${newLineNum}</td>
      <td class="new-content context-line-new">${content}</td>
    </tr>\n`;
      } else {
        html += `    <tr>
      <td class="old-content context-line-old">${content}</td>
      <td class="new-content context-line-new">${content}</td>
    </tr>\n`;
      }

      i++;
    } else if (line.type === 'delete') {
      // Look ahead for corresponding add lines
      const deleteLines: DiffLine[] = [line];
      let j = i + 1;

      while (j < hunk.lines.length && hunk.lines[j].type === 'delete') {
        deleteLines.push(hunk.lines[j]);
        j++;
      }

      const addLines: DiffLine[] = [];
      while (j < hunk.lines.length && hunk.lines[j].type === 'add') {
        addLines.push(hunk.lines[j]);
        j++;
      }

      // Align delete and add lines
      const maxLines = Math.max(deleteLines.length, addLines.length);

      for (let k = 0; k < maxLines; k++) {
        const deleteLine = deleteLines[k];
        const addLine = addLines[k];

        let oldLineNum = '';
        let oldContent = '';
        let oldClass = '';

        if (deleteLine) {
          oldLineNum = settings.showLineNumbers && deleteLine.oldLineNumber ? String(deleteLine.oldLineNumber) : '';
          oldContent = escapeHtml(deleteLine.content);
          oldClass = 'delete-line-old';
        } else {
          oldClass = 'empty-line';
        }

        let newLineNum = '';
        let newContent = '';
        let newClass = '';

        if (addLine) {
          newLineNum = settings.showLineNumbers && addLine.newLineNumber ? String(addLine.newLineNumber) : '';
          newContent = escapeHtml(addLine.content);
          newClass = 'add-line-new';
        } else {
          newClass = 'empty-line';
        }

        if (settings.showLineNumbers) {
          html += `    <tr>
      <td class="old-line-number ${oldClass}">${oldLineNum}</td>
      <td class="old-content ${oldClass}">${oldContent}</td>
      <td class="new-line-number ${newClass}">${newLineNum}</td>
      <td class="new-content ${newClass}">${newContent}</td>
    </tr>\n`;
        } else {
          html += `    <tr>
      <td class="old-content ${oldClass}">${oldContent}</td>
      <td class="new-content ${newClass}">${newContent}</td>
    </tr>\n`;
        }
      }

      i = j;
    } else if (line.type === 'add') {
      // Add line without corresponding delete (pure addition)
      const newLineNum = settings.showLineNumbers && line.newLineNumber ? String(line.newLineNumber) : '';
      const content = escapeHtml(line.content);

      if (settings.showLineNumbers) {
        html += `    <tr>
      <td class="old-line-number empty-line"></td>
      <td class="old-content empty-line"></td>
      <td class="new-line-number add-line-new">${newLineNum}</td>
      <td class="new-content add-line-new">${content}</td>
    </tr>\n`;
      } else {
        html += `    <tr>
      <td class="old-content empty-line"></td>
      <td class="new-content add-line-new">${content}</td>
    </tr>\n`;
      }

      i++;
    }
  }

  html += '  </table>\n';
  html += '</div>\n';

  return html;
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
      <p>Generated by VSPrint - ${dateStr} ${timeStr}</p>
    </div>
  `;
}

/**
 * Generate complete diff HTML document
 */
export async function generateDiffHtml(
  hunks: DiffHunk[],
  fileName: string,
  filePath: string,
  diffType: string,
  settings: PrintSettings
): Promise<string> {
  const styles = generateDiffStyles(settings);
  const header = generateDiffHeader(fileName, filePath, diffType);
  const footer = generateFooter();

  // Determine diff mode from settings
  const diffMode = settings.diff?.mode || 'sideBySide';

  // Generate hunks based on mode
  let hunksHtml = '';
  for (const hunk of hunks) {
    if (diffMode === 'unified') {
      hunksHtml += generateUnifiedHunk(hunk, settings);
    } else {
      hunksHtml += generateSideBySideHunk(hunk, settings);
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fileName)} - Git Diff</title>
  ${styles}
</head>
<body>
  ${header}
  ${hunksHtml}
  ${footer}
</body>
</html>`;
}
