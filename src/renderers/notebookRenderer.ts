import { syntaxHighlighter } from '../services/syntaxHighlighter';
import { PrintSettings } from '../config/settings';
import { marked } from 'marked';

/**
 * Jupyter notebook cell types
 */
type CellType = 'markdown' | 'code' | 'raw';

/**
 * Jupyter notebook cell output types
 */
interface NotebookOutput {
  output_type: 'stream' | 'display_data' | 'execute_result' | 'error';
  name?: string; // for stream outputs (stdout/stderr)
  text?: string | string[]; // for stream/error outputs
  data?: {
    'text/plain'?: string | string[];
    'text/html'?: string | string[];
    'image/png'?: string;
    'image/jpeg'?: string;
    'application/json'?: any;
  };
  ename?: string; // error name
  evalue?: string; // error value
  traceback?: string[]; // error traceback
}

/**
 * Jupyter notebook cell structure
 */
interface NotebookCell {
  cell_type: CellType;
  source: string | string[];
  execution_count?: number | null;
  outputs?: NotebookOutput[];
  metadata?: any;
}

/**
 * Jupyter notebook structure
 */
interface NotebookData {
  cells: NotebookCell[];
  metadata?: {
    kernelspec?: {
      name: string;
      display_name: string;
    };
    language_info?: {
      name: string;
    };
  };
  nbformat: number;
  nbformat_minor: number;
}

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
 * Convert source array or string to single string
 */
function sourceToString(source: string | string[]): string {
  if (Array.isArray(source)) {
    return source.join('');
  }
  return source;
}

/**
 * Truncate text output if it exceeds max lines
 */
function truncateOutput(text: string, maxLines: number): { content: string; truncated: boolean } {
  const lines = text.split('\n');
  if (lines.length <= maxLines) {
    return { content: text, truncated: false };
  }

  const truncated = lines.slice(0, maxLines).join('\n');
  const remaining = lines.length - maxLines;
  return {
    content: truncated + `\n... (${remaining} more lines)`,
    truncated: true
  };
}

/**
 * Render a markdown cell
 */
async function renderMarkdownCell(source: string): Promise<string> {
  try {
    const html = await marked.parse(source);
    return `<div class="notebook-cell notebook-cell-markdown">${html}</div>`;
  } catch (error) {
    // Fallback to escaped HTML if markdown parsing fails
    return `<div class="notebook-cell notebook-cell-markdown"><pre>${escapeHtml(source)}</pre></div>`;
  }
}

/**
 * Render a code cell with syntax highlighting
 */
async function renderCodeCell(
  source: string,
  executionCount: number | null,
  languageId: string,
  theme: string,
  showCellNumbers: boolean
): Promise<string> {
  const highlightedCode = await syntaxHighlighter.highlight(source, languageId, theme);

  const cellNumber = executionCount !== null ? `[${executionCount}]` : '[ ]';
  const cellNumberHtml = showCellNumbers
    ? `<div class="notebook-cell-number">${escapeHtml(cellNumber)}</div>`
    : '';

  return `
    <div class="notebook-cell notebook-cell-code">
      ${cellNumberHtml}
      <div class="notebook-cell-input">
        <pre><code>${highlightedCode}</code></pre>
      </div>
    </div>
  `;
}

/**
 * Render cell outputs
 */
function renderOutputs(
  outputs: NotebookOutput[],
  maxOutputLines: number,
  showOutputs: boolean
): string {
  if (!showOutputs || !outputs || outputs.length === 0) {
    return '';
  }

  let html = '<div class="notebook-cell-outputs">';

  for (const output of outputs) {
    html += renderSingleOutput(output, maxOutputLines);
  }

  html += '</div>';
  return html;
}

/**
 * Render a single output
 */
function renderSingleOutput(output: NotebookOutput, maxOutputLines: number): string {
  switch (output.output_type) {
    case 'stream':
      return renderStreamOutput(output, maxOutputLines);
    case 'display_data':
    case 'execute_result':
      return renderDataOutput(output, maxOutputLines);
    case 'error':
      return renderErrorOutput(output, maxOutputLines);
    default:
      return '';
  }
}

/**
 * Render stream output (stdout/stderr)
 */
function renderStreamOutput(output: NotebookOutput, maxOutputLines: number): string {
  const text = sourceToString(output.text || '');
  const { content, truncated } = truncateOutput(text, maxOutputLines);
  const streamClass = output.name === 'stderr' ? 'notebook-output-stderr' : 'notebook-output-stdout';

  return `
    <div class="notebook-output ${streamClass}">
      <pre>${escapeHtml(content)}</pre>
      ${truncated ? '<div class="notebook-output-truncated">(output truncated)</div>' : ''}
    </div>
  `;
}

/**
 * Render data output (display_data/execute_result)
 */
function renderDataOutput(output: NotebookOutput, maxOutputLines: number): string {
  if (!output.data) {
    return '';
  }

  // Priority: images > HTML > JSON > plain text
  if (output.data['image/png']) {
    return renderImageOutput(output.data['image/png'], 'png');
  }

  if (output.data['image/jpeg']) {
    return renderImageOutput(output.data['image/jpeg'], 'jpeg');
  }

  if (output.data['text/html']) {
    const html = sourceToString(output.data['text/html']);
    return `<div class="notebook-output notebook-output-html">${html}</div>`;
  }

  if (output.data['application/json']) {
    const json = JSON.stringify(output.data['application/json'], null, 2);
    const { content, truncated } = truncateOutput(json, maxOutputLines);
    return `
      <div class="notebook-output notebook-output-json">
        <pre>${escapeHtml(content)}</pre>
        ${truncated ? '<div class="notebook-output-truncated">(output truncated)</div>' : ''}
      </div>
    `;
  }

  if (output.data['text/plain']) {
    const text = sourceToString(output.data['text/plain']);
    const { content, truncated } = truncateOutput(text, maxOutputLines);
    return `
      <div class="notebook-output notebook-output-text">
        <pre>${escapeHtml(content)}</pre>
        ${truncated ? '<div class="notebook-output-truncated">(output truncated)</div>' : ''}
      </div>
    `;
  }

  return '';
}

/**
 * Render image output (PNG/JPEG)
 */
function renderImageOutput(base64Data: string, format: string): string {
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  return `
    <div class="notebook-output notebook-output-image">
      <img src="data:${mimeType};base64,${base64Data}" alt="Output image" />
    </div>
  `;
}

/**
 * Render error output
 */
function renderErrorOutput(output: NotebookOutput, maxOutputLines: number): string {
  const errorName = output.ename || 'Error';
  const errorValue = output.evalue || '';
  const traceback = output.traceback ? output.traceback.join('\n') : '';

  const fullError = `${errorName}: ${errorValue}\n${traceback}`;
  const { content, truncated } = truncateOutput(fullError, maxOutputLines);

  return `
    <div class="notebook-output notebook-output-error">
      <pre>${escapeHtml(content)}</pre>
      ${truncated ? '<div class="notebook-output-truncated">(error output truncated)</div>' : ''}
    </div>
  `;
}

/**
 * Generate CSS styles for notebook rendering
 */
function generateNotebookStyles(settings: PrintSettings, backgroundColor: string, foregroundColor: string): string {
  return `
    <style>
      :root {
        --notebook-bg: ${backgroundColor};
        --notebook-fg: ${foregroundColor};
        --notebook-border: #ddd;
        --notebook-cell-bg: #f9f9f9;
        --notebook-output-bg: #f5f5f5;
        --notebook-error-bg: #fee;
        --notebook-error-fg: #c00;
      }

      body {
        font-family: ${settings.fontFamily};
        font-size: ${settings.fontSize}pt;
        line-height: 1.5;
        color: var(--notebook-fg);
        background: var(--notebook-bg);
        margin: 20px;
      }

      .notebook-header {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid var(--notebook-border);
      }

      .notebook-header h1 {
        font-size: ${settings.fontSize + 6}pt;
        margin-bottom: 5px;
      }

      .notebook-metadata {
        font-size: ${settings.fontSize - 1}pt;
        color: #666;
      }

      .notebook-cell {
        margin-bottom: 15px;
        border: 1px solid var(--notebook-border);
        border-radius: 4px;
        overflow: hidden;
      }

      .notebook-cell-markdown {
        padding: 10px 15px;
        background: white;
      }

      .notebook-cell-code {
        background: var(--notebook-cell-bg);
      }

      .notebook-cell-number {
        padding: 5px 10px;
        font-weight: bold;
        color: #666;
        border-bottom: 1px solid var(--notebook-border);
        background: #eee;
        font-family: monospace;
      }

      .notebook-cell-input {
        padding: 10px 15px;
      }

      .notebook-cell-input pre {
        margin: 0;
        padding: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: ${settings.fontFamily};
        font-size: ${settings.fontSize}pt;
      }

      .notebook-cell-input code {
        font-family: inherit;
        font-size: inherit;
      }

      .notebook-cell-outputs {
        border-top: 1px solid var(--notebook-border);
        background: var(--notebook-output-bg);
      }

      .notebook-output {
        padding: 10px 15px;
      }

      .notebook-output pre {
        margin: 0;
        padding: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: ${settings.fontFamily};
        font-size: ${settings.fontSize - 1}pt;
      }

      .notebook-output-stderr {
        background: #fff3cd;
        border-left: 3px solid #ffc107;
      }

      .notebook-output-error {
        background: var(--notebook-error-bg);
        border-left: 3px solid var(--notebook-error-fg);
      }

      .notebook-output-error pre {
        color: var(--notebook-error-fg);
      }

      .notebook-output-truncated {
        margin-top: 5px;
        font-style: italic;
        color: #666;
        font-size: ${settings.fontSize - 2}pt;
      }

      .notebook-output-image {
        padding: 10px;
        text-align: center;
      }

      .notebook-output-image img {
        max-width: 100%;
        height: auto;
        border: 1px solid var(--notebook-border);
      }

      .notebook-footer {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid var(--notebook-border);
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

        .notebook-cell {
          page-break-inside: avoid;
        }
      }
    </style>
  `;
}

/**
 * Parse and render a Jupyter notebook
 */
export async function renderNotebook(
  notebookContent: string,
  fileName: string,
  settings: PrintSettings
): Promise<string> {
  // Parse notebook JSON
  let notebook: NotebookData;
  try {
    notebook = JSON.parse(notebookContent);
  } catch (error) {
    throw new Error(`Failed to parse notebook JSON: ${(error as Error).message}`);
  }

  // Validate notebook structure
  if (!notebook.cells || !Array.isArray(notebook.cells)) {
    throw new Error('Invalid notebook structure: missing or invalid cells array');
  }

  // Get language from notebook metadata
  const languageId = notebook.metadata?.language_info?.name || 'python';
  const kernelName = notebook.metadata?.kernelspec?.display_name || 'Unknown Kernel';

  // Get theme colors
  const backgroundColor = await syntaxHighlighter.getThemeBackground(settings.theme);
  const foregroundColor = await syntaxHighlighter.getThemeForeground(settings.theme);

  // Get notebook-specific settings from VS Code config
  const showCellNumbers = settings.notebook?.showCellNumbers ?? true;
  const showOutputs = settings.notebook?.showOutputs ?? true;
  const maxOutputLines = settings.notebook?.maxOutputLines ?? 100;

  // Generate styles
  const styles = generateNotebookStyles(settings, backgroundColor, foregroundColor);

  // Start building HTML
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fileName)} - Notebook</title>
  ${styles}
</head>
<body>
  <div class="notebook-header">
    <h1>${escapeHtml(fileName)}</h1>
    <div class="notebook-metadata">
      <strong>Kernel:</strong> ${escapeHtml(kernelName)} |
      <strong>Language:</strong> ${escapeHtml(languageId)} |
      <strong>Cells:</strong> ${notebook.cells.length}
    </div>
  </div>
  <div class="notebook-content">
`;

  // Render each cell
  for (const cell of notebook.cells) {
    const source = sourceToString(cell.source);

    if (cell.cell_type === 'markdown') {
      html += await renderMarkdownCell(source);
    } else if (cell.cell_type === 'code') {
      html += await renderCodeCell(
        source,
        cell.execution_count ?? null,
        languageId,
        settings.theme,
        showCellNumbers
      );

      // Render outputs if available
      if (cell.outputs) {
        html += renderOutputs(cell.outputs, maxOutputLines, showOutputs);
      }
    } else if (cell.cell_type === 'raw') {
      // Render raw cells as preformatted text
      html += `
        <div class="notebook-cell notebook-cell-raw">
          <pre>${escapeHtml(source)}</pre>
        </div>
      `;
    }
  }

  html += `
  </div>
  <div class="notebook-footer">
    Generated by VSPrint
  </div>
</body>
</html>`;

  return html;
}
