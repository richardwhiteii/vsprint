import { FileMetadata } from '../commands/printFile';
import { PrintSettings } from '../config/settings';
import { syntaxHighlighter } from '../services/syntaxHighlighter';
import { FoldRange } from '../services/codeIntelligence';
import { visualizeWhitespace } from '../utils/textTransform';
import { pageLayoutService } from '../services/pageLayout';
import { loadCustomCss, loadBuiltinTheme, combineCssStyles, BuiltinThemeName } from '../utils/cssLoader';
import { generateWatermarkCss, generateWatermarkHtml } from '../utils/watermark';
import { generateBrandingCss, generateBrandingHtml, embedLogo, getWorkspaceRoot } from '../utils/branding';
import * as vscode from 'vscode';

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
  // Get column-specific CSS
  const columnCss = pageLayoutService.generateColumnCss(settings.columns);

  // Generate watermark CSS if watermark is configured
  const watermarkCss = settings.watermark ? generateWatermarkCss(settings.watermark) : '';

  // Generate branding CSS if branding is configured
  const brandingCss = settings.branding ? generateBrandingCss(settings.branding) : '';

  return `
    <style>
      /* CSS Variable Hooks for Theme Customization */
      :root {
        --vsprint-bg-color: ${backgroundColor};
        --vsprint-text-color: ${foregroundColor};
        --vsprint-line-number-color: #999;
        --vsprint-border-color: #ccc;
        --vsprint-header-bg: transparent;
        --vsprint-code-font: ${settings.fontFamily};
        --vsprint-font-size: ${settings.fontSize}pt;
        --vsprint-line-height: 1.5;
        --vsprint-margin-top: 10mm;
        --vsprint-margin-bottom: 10mm;
        --vsprint-margin-left: 10mm;
        --vsprint-margin-right: 10mm;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: var(--vsprint-code-font);
        font-size: var(--vsprint-font-size);
        line-height: var(--vsprint-line-height);
        color: var(--vsprint-text-color);
        background: var(--vsprint-bg-color);
      }

      .header {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--vsprint-border-color);
        background-color: var(--vsprint-header-bg);
      }

      .header h1 {
        font-size: ${settings.fontSize + 4}pt;
        margin-bottom: 5px;
      }

      .header .metadata {
        font-size: ${settings.fontSize - 1}pt;
        color: #666;
      }

      .page-header {
        margin-bottom: 10px;
        padding: 5px 0;
        font-size: ${settings.fontSize}pt;
        font-weight: bold;
        border-bottom: 1px solid var(--vsprint-border-color);
      }

      .page-footer {
        margin-top: 10px;
        padding: 5px 0;
        font-size: ${settings.fontSize - 1}pt;
        text-align: center;
        border-top: 1px solid var(--vsprint-border-color);
        color: #666;
      }

      .code-content {
        width: 100%;
      }

      .code-container {
        width: 100%;
        border-collapse: collapse;
      }

      .line-number {
        text-align: right;
        padding-right: 10px;
        color: var(--vsprint-line-number-color);
        border-right: 1px solid var(--vsprint-border-color);
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
        border-top: 1px solid var(--vsprint-border-color);
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

      ${columnCss}

      ${watermarkCss}

      ${brandingCss}

      @media print {
        @page {
          margin: 1in;
        }

        body {
          background: none;
        }

        .header, .footer, .page-header, .page-footer {
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
  // Apply whitespace visualization if enabled and content is pre-highlighted
  let processedContent = content;
  if (isPreHighlighted && settings.showWhitespace !== 'none') {
    processedContent = visualizeWhitespace(content, settings.showWhitespace);
  }

  const lines = processedContent.split('\n');
  const boundarySet = new Set(symbolBoundaries);
  let html = `<div class="code-content columns-${settings.columns}">\n`;
  html += '<table class="code-container code-block">\n';

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

  html += '</table>\n';
  html += '</div>';
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

  // Embed logo if branding is configured
  let logoDataUri: string | undefined;
  if (settings.branding?.logo) {
    try {
      const workspaceRoot = getWorkspaceRoot();
      logoDataUri = await embedLogo(settings.branding.logo, workspaceRoot);
    } catch (error) {
      vscode.window.showWarningMessage(
        `VSPrint: Failed to embed logo: ${error instanceof Error ? error.message : String(error)}`
      );
      // Continue without logo
    }
  }

  // Generate base styles
  const baseStyles = generateStyles(settings, backgroundColor, foregroundColor);

  // Load custom CSS or built-in theme if specified
  let additionalCss = '';

  // Try to load custom CSS first (takes precedence)
  if (settings.customCss && settings.customCss.trim()) {
    try {
      additionalCss = await loadCustomCss(settings.customCss);
    } catch (error) {
      vscode.window.showErrorMessage(
        `VSPrint: Failed to load custom CSS: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  // If no custom CSS, try to load built-in theme
  else if (settings.builtinTheme && settings.builtinTheme !== 'default') {
    try {
      additionalCss = await loadBuiltinTheme(settings.builtinTheme as BuiltinThemeName);
    } catch (error) {
      vscode.window.showWarningMessage(
        `VSPrint: Failed to load built-in theme '${settings.builtinTheme}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Combine base styles with additional CSS and color scheme overrides
  const finalStyles = combineCssStyles(
    baseStyles,
    additionalCss,
    settings.colorScheme
  );

  const header = generateHeader(metadata);
  const codeTable = generateCodeTable(highlightedCode, settings, true, symbolBoundaries);
  const footer = generateFooter();

  // Create page metadata for header/footer templates
  const pageMetadata = pageLayoutService.createPageMetadata(
    metadata.fileName,
    metadata.filePath,
    1 // For now, use 1 as total pages (can be calculated later based on content height)
  );

  // Render page header and footer if templates are provided
  const pageHeader = settings.headerTemplate
    ? pageLayoutService.renderHeader(settings.headerTemplate, 1, pageMetadata)
    : '';
  const pageFooter = settings.footerTemplate
    ? pageLayoutService.renderFooter(settings.footerTemplate, 1, pageMetadata)
    : '';

  // Generate watermark HTML if configured
  const watermarkHtml = settings.watermark ? generateWatermarkHtml(settings.watermark) : '';

  // Generate branding HTML if configured
  let brandingHtml = '';
  if (settings.branding) {
    brandingHtml = generateBrandingHtml(settings.branding, logoDataUri);
  }

  // Position branding in header or footer based on settings
  const brandingInHeader = settings.branding?.position === 'header' ? brandingHtml : '';
  const brandingInFooter = settings.branding?.position === 'footer' ? brandingHtml : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metadata.fileName)} - Print</title>
  ${finalStyles}
</head>
<body>
  ${watermarkHtml}
  ${brandingInHeader}
  ${header}
  ${pageHeader}
  ${codeTable}
  ${pageFooter}
  ${footer}
  ${brandingInFooter}
</body>
</html>`;
}
