/**
 * Page layout service for handling headers, footers, columns, and page breaks
 */

export interface PageLayoutOptions {
  headerTemplate?: string;
  footerTemplate?: string;
  columns: 1 | 2 | 4;
  pageHeight: number;
  orphanWidowControl: boolean;
}

export interface PageMetadata {
  filename: string;
  filepath: string;
  date: string;
  time: string;
  totalPages: number;
}

export interface CodeBlock {
  startLine: number;
  endLine: number;
  height: number;
}

/**
 * Page layout service for managing page breaks, headers, footers, and multi-column layouts
 */
export class PageLayoutService {
  /**
   * Calculate page break positions based on content height
   *
   * @param contentHeight - Total height of content in pixels
   * @param pageHeight - Height of each page in pixels
   * @returns Array of page break positions (pixel offsets from top)
   */
  calculatePageBreaks(contentHeight: number, pageHeight: number): number[] {
    if (pageHeight <= 0 || contentHeight <= pageHeight) {
      return [];
    }

    const pageBreaks: number[] = [];
    let currentPosition = pageHeight;

    while (currentPosition < contentHeight) {
      pageBreaks.push(currentPosition);
      currentPosition += pageHeight;
    }

    return pageBreaks;
  }

  /**
   * Render header template with placeholder substitution
   *
   * @param template - Header template string with placeholders
   * @param pageNum - Current page number (1-based)
   * @param metadata - Page metadata for placeholder substitution
   * @returns Rendered header HTML string
   */
  renderHeader(template: string, pageNum: number, metadata: PageMetadata): string {
    if (!template) {
      return '';
    }

    const rendered = this.substitutePlaceholders(template, pageNum, metadata);
    return `<div class="page-header">${this.escapeHtml(rendered)}</div>`;
  }

  /**
   * Render footer template with placeholder substitution
   *
   * @param template - Footer template string with placeholders
   * @param pageNum - Current page number (1-based)
   * @param metadata - Page metadata for placeholder substitution
   * @returns Rendered footer HTML string
   */
  renderFooter(template: string, pageNum: number, metadata: PageMetadata): string {
    if (!template) {
      return '';
    }

    const rendered = this.substitutePlaceholders(template, pageNum, metadata);
    return `<div class="page-footer">${this.escapeHtml(rendered)}</div>`;
  }

  /**
   * Apply orphan and widow control to page breaks
   * Adjusts page breaks to prevent single lines at page boundaries
   *
   * @param pageBreaks - Initial page break positions
   * @param codeBlocks - Code blocks with start/end line numbers and heights
   * @returns Adjusted page break positions
   */
  applyOrphanWidowControl(pageBreaks: number[], codeBlocks: CodeBlock[]): number[] {
    if (pageBreaks.length === 0 || codeBlocks.length === 0) {
      return pageBreaks;
    }

    const adjustedBreaks = [...pageBreaks];

    // For each page break, check if it splits a code block creating orphans/widows
    for (let i = 0; i < adjustedBreaks.length; i++) {
      const breakPosition = adjustedBreaks[i];

      // Find code blocks that intersect with this page break
      for (const block of codeBlocks) {
        const blockStart = this.lineToPixel(block.startLine, codeBlocks);
        const blockEnd = this.lineToPixel(block.endLine, codeBlocks);

        // Check if break is within the block
        if (breakPosition > blockStart && breakPosition < blockEnd) {
          const linesAbove = Math.floor((breakPosition - blockStart) / (block.height / (block.endLine - block.startLine + 1)));
          const linesBelow = (block.endLine - block.startLine + 1) - linesAbove;

          // If only 1 line would be orphaned or widowed, adjust the break
          if (linesAbove === 1) {
            // Move break up to keep block together on previous page
            adjustedBreaks[i] = blockStart - 1;
          } else if (linesBelow === 1) {
            // Move break down to keep block together on next page
            adjustedBreaks[i] = blockEnd + 1;
          }
        }
      }
    }

    return adjustedBreaks;
  }

  /**
   * Generate CSS for multi-column layout
   *
   * @param columns - Number of columns (1, 2, or 4)
   * @returns CSS string for column layout
   */
  generateColumnCss(columns: 1 | 2 | 4): string {
    const columnConfig = {
      1: { count: 1, gap: '0', fontSize: '12pt' },
      2: { count: 2, gap: '1.5em', fontSize: '10pt' },
      4: { count: 4, gap: '1em', fontSize: '8pt' }
    };

    const config = columnConfig[columns];

    return `
      .code-content.columns-${columns} {
        column-count: ${config.count};
        column-gap: ${config.gap};
        column-fill: balance;
        font-size: ${config.fontSize};
      }
      .code-content.columns-${columns} .code-block {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    `;
  }

  /**
   * Create page metadata from file information and current date/time
   *
   * @param filename - File name (e.g., "example.ts")
   * @param filepath - Full file path
   * @param totalPages - Total number of pages
   * @returns PageMetadata object
   */
  createPageMetadata(filename: string, filepath: string, totalPages: number): PageMetadata {
    const now = new Date();

    return {
      filename,
      filepath,
      date: this.formatDate(now),
      time: this.formatTime(now),
      totalPages
    };
  }

  /**
   * Substitute template placeholders with actual values
   *
   * @param template - Template string with placeholders
   * @param pageNum - Current page number (1-based)
   * @param metadata - Page metadata for substitution
   * @returns Template with placeholders replaced
   */
  private substitutePlaceholders(template: string, pageNum: number, metadata: PageMetadata): string {
    return template
      .replace(/\{filename\}/g, metadata.filename)
      .replace(/\{filepath\}/g, metadata.filepath)
      .replace(/\{date\}/g, metadata.date)
      .replace(/\{time\}/g, metadata.time)
      .replace(/\{page\}/g, String(pageNum))
      .replace(/\{pages\}/g, String(metadata.totalPages));
  }

  /**
   * Format date as YYYY-MM-DD
   *
   * @param date - Date object
   * @returns Formatted date string
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format time as HH:MM:SS
   *
   * @param date - Date object
   * @returns Formatted time string
   */
  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Escape HTML entities to prevent XSS
   *
   * @param text - Text to escape
   * @returns HTML-safe text
   */
  private escapeHtml(text: string): string {
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
   * Convert line number to pixel position
   * Helper method for orphan/widow control
   *
   * @param lineNum - Line number
   * @param codeBlocks - All code blocks for context
   * @returns Pixel position
   */
  private lineToPixel(lineNum: number, codeBlocks: CodeBlock[]): number {
    let pixelOffset = 0;

    for (const block of codeBlocks) {
      if (lineNum >= block.startLine && lineNum <= block.endLine) {
        const linesIntoBlock = lineNum - block.startLine;
        const lineHeight = block.height / (block.endLine - block.startLine + 1);
        return pixelOffset + (linesIntoBlock * lineHeight);
      }

      if (lineNum > block.endLine) {
        pixelOffset += block.height;
      }
    }

    return pixelOffset;
  }
}

// Export singleton instance
export const pageLayoutService = new PageLayoutService();
