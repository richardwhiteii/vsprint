import { createHighlighter, bundledLanguages, Highlighter } from 'shiki';

/**
 * Syntax highlighter service using Shiki
 * Provides syntax highlighting for code with theme support
 */
class SyntaxHighlighter {
  private highlighter: Highlighter | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Map VS Code language IDs to Shiki language IDs
   */
  private languageMap: Record<string, string> = {
    'typescript': 'ts',
    'javascript': 'js',
    'python': 'py',
    'typescriptreact': 'tsx',
    'javascriptreact': 'jsx',
    'csharp': 'cs',
    'cpp': 'cpp',
    'c': 'c',
    'java': 'java',
    'go': 'go',
    'rust': 'rust',
    'ruby': 'rb',
    'php': 'php',
    'swift': 'swift',
    'kotlin': 'kt',
    'shellscript': 'sh',
    'powershell': 'ps1',
    'yaml': 'yaml',
    'json': 'json',
    'markdown': 'md',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'sql': 'sql',
    'xml': 'xml'
  };

  /**
   * Map theme names to Shiki theme IDs
   */
  private themeMap: Record<string, string> = {
    'light': 'light-plus',
    'dark': 'dark-plus',
    'github-light': 'github-light',
    'github-dark': 'github-dark',
    'monokai': 'monokai'
  };

  /**
   * Initialize the Shiki highlighter
   * Loads all bundled languages and themes
   */
  private async initialize(): Promise<void> {
    if (this.highlighter) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      this.highlighter = await createHighlighter({
        themes: Object.values(this.themeMap),
        langs: Object.keys(bundledLanguages)
      });
    })();

    return this.initPromise;
  }

  /**
   * Map VS Code language ID to Shiki language ID
   */
  private mapLanguage(languageId: string): string {
    return this.languageMap[languageId] || languageId;
  }

  /**
   * Map theme name to Shiki theme ID
   */
  private mapTheme(theme: string): string {
    return this.themeMap[theme] || 'github-light';
  }

  /**
   * Escape HTML entities for plain text fallback
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
   * Extract code content from Shiki HTML output
   * Shiki returns full HTML with <pre><code>...</code></pre> wrapper
   * We need just the inner highlighted spans
   */
  private extractCodeContent(html: string): string {
    // Remove <pre class="..."> and </pre>
    let content = html.replace(/<pre[^>]*>/, '').replace(/<\/pre>/, '');
    // Remove <code> and </code>
    content = content.replace(/<code[^>]*>/, '').replace(/<\/code>/, '');
    return content.trim();
  }

  /**
   * Highlight code with syntax highlighting
   *
   * @param code - Source code to highlight
   * @param languageId - VS Code language ID
   * @param theme - Theme name
   * @returns HTML string with syntax-highlighted code spans
   */
  async highlight(code: string, languageId: string, theme: string): Promise<string> {
    await this.initialize();

    if (!this.highlighter) {
      // Fallback to plain escaped HTML
      return this.escapeHtml(code);
    }

    const shikiLang = this.mapLanguage(languageId);
    const shikiTheme = this.mapTheme(theme);

    try {
      // Check if language is supported
      const loadedLanguages = this.highlighter.getLoadedLanguages();
      if (!loadedLanguages.includes(shikiLang as any)) {
        // Language not supported, return plain escaped HTML
        return this.escapeHtml(code);
      }

      // Generate highlighted HTML
      const html = this.highlighter.codeToHtml(code, {
        lang: shikiLang,
        theme: shikiTheme
      });

      // Extract just the code content (spans with highlighting)
      return this.extractCodeContent(html);

    } catch (error) {
      // Fallback to plain escaped HTML on error
      console.error('Syntax highlighting failed:', error);
      return this.escapeHtml(code);
    }
  }

  /**
   * Get background color for the theme
   * Used to set appropriate background in styles
   */
  async getThemeBackground(theme: string): Promise<string> {
    await this.initialize();

    if (!this.highlighter) {
      return '#ffffff';
    }

    const shikiTheme = this.mapTheme(theme);

    try {
      const themeData = this.highlighter.getTheme(shikiTheme);
      return themeData.bg || '#ffffff';
    } catch (error) {
      return '#ffffff';
    }
  }

  /**
   * Get foreground color for the theme
   * Used to set appropriate text color in styles
   */
  async getThemeForeground(theme: string): Promise<string> {
    await this.initialize();

    if (!this.highlighter) {
      return '#000000';
    }

    const shikiTheme = this.mapTheme(theme);

    try {
      const themeData = this.highlighter.getTheme(shikiTheme);
      return themeData.fg || '#000000';
    } catch (error) {
      return '#000000';
    }
  }
}

// Export singleton instance
export const syntaxHighlighter = new SyntaxHighlighter();
