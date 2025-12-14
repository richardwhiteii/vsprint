import * as vscode from 'vscode';

export interface FoldRange {
  start: number;
  end: number;
  kind?: string;
}

/**
 * Import/require patterns by language
 * Each pattern matches the start of an import line
 */
const IMPORT_PATTERNS: Record<string, RegExp[]> = {
  // JavaScript/TypeScript: import ... from, require(), export ... from
  typescript: [
    /^\s*import\s+/,
    /^\s*export\s+.*\s+from\s+/,
    /^\s*(?:const|let|var)\s+.*=\s*require\s*\(/
  ],
  javascript: [
    /^\s*import\s+/,
    /^\s*export\s+.*\s+from\s+/,
    /^\s*(?:const|let|var)\s+.*=\s*require\s*\(/
  ],
  typescriptreact: [
    /^\s*import\s+/,
    /^\s*export\s+.*\s+from\s+/,
    /^\s*(?:const|let|var)\s+.*=\s*require\s*\(/
  ],
  javascriptreact: [
    /^\s*import\s+/,
    /^\s*export\s+.*\s+from\s+/,
    /^\s*(?:const|let|var)\s+.*=\s*require\s*\(/
  ],
  // Python: import ..., from ... import
  python: [
    /^\s*import\s+/,
    /^\s*from\s+\S+\s+import\s+/
  ],
  // Java: import ...;
  java: [
    /^\s*import\s+/
  ],
  // Go: import "..." or import (...)
  go: [
    /^\s*import\s+[\("]/,
    /^\s*import\s*$/  // Start of import block
  ],
  // Rust: use ...;
  rust: [
    /^\s*use\s+/
  ],
  // C/C++: #include ...
  c: [
    /^\s*#\s*include\s+/
  ],
  cpp: [
    /^\s*#\s*include\s+/
  ]
};

class CodeIntelligenceService {
  private static instance: CodeIntelligenceService;

  public static getInstance(): CodeIntelligenceService {
    if (!CodeIntelligenceService.instance) {
      CodeIntelligenceService.instance = new CodeIntelligenceService();
    }
    return CodeIntelligenceService.instance;
  }

  /**
   * Get folding ranges for a document
   * @param uri - Document URI
   * @param mode - 'expand' | 'collapse' | 'asIs'
   */
  async getFoldedRanges(uri: vscode.Uri, mode: string): Promise<FoldRange[]> {
    if (mode === 'expand') return [];

    try {
      const ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>(
        'vscode.executeFoldingRangeProvider',
        uri
      );

      if (!ranges) return [];

      return ranges.map(r => ({
        start: r.start,
        end: r.end,
        kind: r.kind?.toString()
      }));
    } catch {
      return []; // No folding provider available
    }
  }

  /**
   * Get the line number after the last import statement
   * Returns 0 if no imports found or file is all imports
   *
   * @param content - File content
   * @param languageId - Language identifier
   */
  getImportSectionEnd(content: string, languageId: string): number {
    const patterns = IMPORT_PATTERNS[languageId];
    if (!patterns) return 0;

    const lines = content.split('\n');
    let lastImportLine = -1;
    let inMultiLineImport = false;
    let inGoImportBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines and comments when tracking imports
      if (trimmed === '' || this.isComment(trimmed, languageId)) {
        continue;
      }

      // Handle Go's multi-line import block: import (...)
      if (languageId === 'go') {
        if (/^\s*import\s*\(\s*$/.test(line)) {
          inGoImportBlock = true;
          lastImportLine = i;
          continue;
        }
        if (inGoImportBlock) {
          lastImportLine = i;
          if (trimmed === ')') {
            inGoImportBlock = false;
          }
          continue;
        }
      }

      // Handle multi-line imports (lines ending with comma or backslash, or unclosed parens)
      if (inMultiLineImport) {
        lastImportLine = i;
        // Check if this line closes the import
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        if (closeParens > openParens || (!line.endsWith(',') && !line.endsWith('\\'))) {
          inMultiLineImport = false;
        }
        continue;
      }

      // Check if line matches any import pattern
      const isImport = patterns.some(pattern => pattern.test(line));
      if (isImport) {
        lastImportLine = i;
        // Check if this is a multi-line import
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        if (openParens > closeParens || line.endsWith(',') || line.endsWith('\\')) {
          inMultiLineImport = true;
        }
      }
    }

    // No imports found
    if (lastImportLine === -1) return 0;

    // Find the first non-empty, non-comment line after imports
    for (let i = lastImportLine + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed !== '' && !this.isComment(trimmed, languageId)) {
        // Return 1-based line number for separator insertion
        return i + 1;
      }
    }

    // File is all imports (no code after), don't add separator
    return 0;
  }

  /**
   * Check if a line is a comment
   */
  private isComment(trimmedLine: string, languageId: string): boolean {
    // Single-line comments
    if (trimmedLine.startsWith('//')) return true;
    if (trimmedLine.startsWith('#') && ['python', 'ruby', 'shell', 'bash'].includes(languageId)) return true;
    if (trimmedLine.startsWith('--') && languageId === 'lua') return true;

    // Multi-line comment start (simplified - doesn't track state)
    if (trimmedLine.startsWith('/*') || trimmedLine.startsWith('/**')) return true;
    if (trimmedLine.startsWith('*')) return true; // Inside multi-line comment

    return false;
  }

  /**
   * Get line numbers where symbol boundaries occur (for separators)
   * @param uri - Document URI
   */
  async getSymbolBoundaries(uri: vscode.Uri): Promise<number[]> {
    try {
      const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        uri
      );

      if (!symbols || symbols.length === 0) return [];

      // Filter for top-level functions, classes, interfaces, methods
      const relevantKinds = [
        vscode.SymbolKind.Function,
        vscode.SymbolKind.Class,
        vscode.SymbolKind.Interface,
        vscode.SymbolKind.Method,
        vscode.SymbolKind.Enum
      ];

      const topLevel = symbols.filter(s => relevantKinds.includes(s.kind));

      // Return start line numbers, sorted, skipping the first one (no separator before first symbol)
      const lineNumbers = topLevel
        .map(s => s.range.start.line + 1) // +1 for 1-based line numbers
        .sort((a, b) => a - b);

      // Skip first symbol (don't put separator before first function)
      return lineNumbers.slice(1);
    } catch {
      return []; // No symbol provider available
    }
  }
}

export const codeIntelligence = CodeIntelligenceService.getInstance();
