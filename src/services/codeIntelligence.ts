import * as vscode from 'vscode';

export interface FoldRange {
  start: number;
  end: number;
  kind?: string;
}

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
