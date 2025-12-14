# VSPRINT-007: Enhanced Formatting - Code Intelligence (Folds & Symbols)

## Status
- **Status**: [ ] Not Started
- **Assignee**: —
- **Branch**: `feature/VSPRINT-007-code-intelligence`
- **Worktree**: `feat-007/`
- **PR**: —

## Ticket Info
| Field | Value |
|-------|-------|
| **Points** | 2pt |
| **Phase** | Phase 2: Enhanced Formatting |
| **Dependencies** | VSPRINT-005 |
| **Parallel With** | VSPRINT-006 |
| **Priority** | Medium |

## Source Reference
- **Punchlist**: `PUNCHLIST_001.md`
- **Phase**: Phase 2 - Enhanced Formatting
- **Tasks**: 2.5, 2.6

## Git Workflow

### Starting This Ticket
```bash
cd /home/richard/projects/vsprint
git worktree add feat-007 -b feature/VSPRINT-007-code-intelligence dev
code feat-007
```

### During Implementation
```bash
cd feat-007
git add -A && git commit -m "feat: VSPRINT-007 add code intelligence with folds and symbols"
```

### Completing This Ticket
```bash
cd feat-007
git push -u origin feature/VSPRINT-007-code-intelligence
gh pr create --base dev --title "feat: VSPRINT-007 Code intelligence (folds and symbols)"
```

### After PR Merged
```bash
cd /home/richard/projects/vsprint
git worktree remove feat-007
cd dev && git pull origin dev
```

### Parallel Execution with VSPRINT-006
This ticket can run in parallel with VSPRINT-006 (Line Wrapping):

```bash
# Create both worktrees after VSPRINT-005 is merged:
cd /home/richard/projects/vsprint
git worktree add feat-006 -b feature/VSPRINT-006-line-wrapping dev
git worktree add feat-007 -b feature/VSPRINT-007-code-intelligence dev

# Open in separate windows:
code feat-006  # Work on line wrapping (parallel)
code feat-007  # Work on code intelligence
```

### Merge Order
Either ticket can merge first. After one merges:
1. `cd [other-worktree] && git pull origin dev`
2. Resolve any conflicts (unlikely - different code areas)
3. Continue with PR for remaining ticket

## Objective

Integrate VS Code's code intelligence APIs to enhance printed output with fold-aware printing and visual symbol boundaries. This allows users to print collapsed code regions as placeholders and adds visual separators between functions/classes for improved readability.

## Context

After VSPRINT-005 adds syntax highlighting, printed code has color but lacks structural awareness. Developers often collapse boilerplate code (imports, long functions) in the editor but want that collapsed state reflected in printed output. Additionally, large files become hard to navigate without visual boundaries between major code blocks.

This ticket adds two code intelligence features:

1. **Fold Awareness**: Respect editor's folding state when printing
   - `expand`: Expand all folds before printing (default)
   - `collapse`: Show collapsed regions as placeholders (e.g., `{...}`)
   - `asIs`: Print exactly as shown in editor (respects current folds)

2. **Symbol Boundaries**: Add visual separators between code structures
   - Query VS Code's Document Symbol Provider
   - Identify functions, classes, interfaces, methods
   - Insert subtle horizontal lines between top-level symbols
   - Configurable: `vsprint.showSeparators: boolean`

Both features use VS Code's built-in Language Server Protocol (LSP) integration. They query document metadata and transform the HTML output accordingly.

Integration points:
- **Create**: `src/services/codeIntelligence.ts` (new service)
- **Modify**: `src/renderers/htmlRenderer.ts` lines 159-181 (add separators)
- **Modify**: `src/config/settings.ts` lines 6-10, 15-19, 27-35 (new settings)
- **Modify**: `package.json` lines 43-64 (configuration options)

## Implementation Approach

**Fold Awareness:**
1. Query folding ranges: `vscode.commands.executeCommand('vscode.executeFoldingRangeProvider', uri)`
2. Returns array of `{start: number, end: number, kind?: string}`
3. For `collapse` mode: Replace lines `start+1` to `end` with placeholder line
4. Placeholder: `// {... N lines collapsed ...}` with special CSS class
5. For `asIs` mode: Query current editor's folded state (more complex - may defer to v2)

**Symbol Boundaries:**
1. Query document symbols: `vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri)`
2. Returns array of `DocumentSymbol` objects with `kind`, `range`, `name`
3. Filter for top-level symbols: `kind === Function || kind === Class || kind === Method`
4. Sort symbols by line number
5. Insert `<tr class="separator">` before each symbol's start line
6. CSS: `.separator td { border-top: 2px solid #e0e0e0; padding-top: 10px; }`

**Architecture Decision:**
Create `CodeIntelligenceService` class with two methods:
- `async getFoldedRanges(uri: Uri, mode: string): Promise<FoldRange[]>`
- `async getSymbolBoundaries(uri: Uri): Promise<number[]>` (returns line numbers)

Call these services in `printFileCommand` before HTML generation, pass results to renderer.

## Technical Requirements

**Constraints:**
- MUST handle languages without folding provider gracefully (return empty array)
- MUST handle languages without symbol provider gracefully (no separators)
- MUST preserve syntax highlighting when inserting fold placeholders
- MUST NOT break line number alignment with separators
- MUST make separator lines subtle (not bold, light gray)
- SHOULD support all symbol kinds: Function, Class, Interface, Method, Enum
- SHOULD include fold level indicators in placeholders (e.g., `{... Level 2 ...}`)
- MAY support custom separator styles in future (dashed, dotted)

### Source File References

```
File: /home/richard/projects/vsprint/dev/src/commands/printFile.ts
Lines: 37-76 - printFileCommand function
  Add code intelligence queries before HTML generation:
  - Query folding ranges if foldedRegions !== 'expand'
  - Query symbol boundaries if showSeparators === true
  - Pass results to generatePrintHtml

Lines: 52-53 - metadata extraction
  Need document URI for LSP queries.
  Modify FileMetadata interface to include uri: vscode.Uri
```

```
File: /home/richard/projects/vsprint/dev/src/renderers/htmlRenderer.ts
Lines: 159-181 - generateCodeTable function
  Accept symbolBoundaries parameter (array of line numbers).
  Before each line in symbolBoundaries, insert separator row:
  `<tr class="separator"><td colspan="2"></td></tr>`

Lines: 28-118 - generateStyles function
  Add CSS for .separator class:
  `border-top: 2px solid #e0e0e0; padding-top: 8px;`

Lines: 191-215 - generatePrintHtml entry point
  Accept foldedRanges and symbolBoundaries parameters.
  Apply fold placeholders to content before highlighting.
```

```
File: /home/richard/projects/vsprint/dev/src/config/settings.ts
Lines: 6-10 - PrintSettings interface
  Add `foldedRegions: 'expand' | 'collapse' | 'asIs'`
  Add `showSeparators: boolean`

Lines: 15-19 - DEFAULT_SETTINGS
  Add `foldedRegions: 'expand'` as default
  Add `showSeparators: false` as default

Lines: 27-35 - getSettings function
  Add foldedRegions retrieval with fallback
  Add showSeparators retrieval with fallback
```

```
File: /home/richard/projects/vsprint/dev/package.json
Lines: 43-64 - configuration.properties
  Add vsprint.foldedRegions with enum: ["expand", "collapse", "asIs"]
  Add vsprint.showSeparators with type: boolean
```

### Files to Create/Modify

```
src/
├── services/
│   └── codeIntelligence.ts      # CREATE - ~200 lines
│       - CodeIntelligenceService class
│       - getFoldedRanges(uri, mode): Promise<FoldRange[]>
│       - getSymbolBoundaries(uri): Promise<number[]>
│       - Helper: filterTopLevelSymbols(symbols)
│       - Helper: sortSymbolsByLine(symbols)
│       - Interface: FoldRange { start, end, kind }
│
├── commands/
│   └── printFile.ts             # MODIFY lines 10-16, 37-76
│       - Add uri to FileMetadata interface
│       - Query code intelligence before HTML generation
│       - Pass fold/symbol data to renderer
│
├── renderers/
│   └── htmlRenderer.ts          # MODIFY lines 28-118, 159-181, 191-215
│       - Add separator CSS
│       - Accept symbolBoundaries parameter
│       - Insert separator rows in table
│       - Apply fold placeholders to content
│
├── config/
│   └── settings.ts              # MODIFY lines 6-10, 15-19, 27-35
│       - Add foldedRegions property
│       - Add showSeparators property
│       - Add getters for both settings
│
package.json                     # MODIFY lines 43-64
  - Add vsprint.foldedRegions configuration
  - Add vsprint.showSeparators configuration
```

## Acceptance Criteria

#### AC1: Fold Awareness - Expand Mode
- **Given** a TypeScript file with collapsed functions in the editor
- **When** user sets `vsprint.foldedRegions` to "expand" and prints
- **Then** all code is visible in printed output (folds are ignored)
- **And** no fold placeholders appear

#### AC2: Fold Awareness - Collapse Mode
- **Given** a file with a folding range at lines 10-50 (40 lines)
- **When** user sets `vsprint.foldedRegions` to "collapse" and prints
- **Then** lines 11-50 are replaced with `// {... 40 lines collapsed ...}`
- **And** placeholder line has special CSS styling (gray, italic)
- **And** line numbers jump from 10 to 51 in output

#### AC3: Symbol Boundaries - Functions
- **Given** a JavaScript file with 3 top-level functions
- **When** user sets `vsprint.showSeparators` to `true` and prints
- **Then** 2 visual separator lines appear (before function 2 and 3)
- **And** separator lines are subtle (light gray, 2px)
- **And** no separator appears before first function

#### AC4: Symbol Boundaries - Classes
- **Given** a Python file with 4 classes
- **When** user sets `vsprint.showSeparators` to `true` and prints
- **Then** 3 separator lines appear between classes
- **And** separators span full width of code table

#### AC5: Graceful Degradation - No Provider
- **Given** a plain text `.txt` file (no LSP support)
- **When** user prints with `showSeparators: true` and `foldedRegions: collapse`
- **Then** file prints normally without separators
- **And** no errors are shown to user
- **And** no fold placeholders appear (no folding provider)

#### AC6: Combined Features
- **Given** settings: `foldedRegions: "collapse"`, `showSeparators: true`
- **When** printing a TypeScript file with collapsed imports and 3 functions
- **Then** imports show as collapsed placeholder
- **And** separator lines appear between functions
- **And** syntax highlighting is preserved

## Testing Requirements

### Test Commands
```bash
cd feat-007
npm test -- --grep "codeIntelligence"
npm test -- --grep "fold"
npm test -- --grep "symbol"
```

### Test Files to Create
```
test/
├── services/
│   └── codeIntelligence.test.ts # CREATE - ~150 lines
│       - Test getFoldedRanges with expand mode (returns empty)
│       - Test getFoldedRanges with collapse mode (returns ranges)
│       - Test getSymbolBoundaries with TypeScript file
│       - Test getSymbolBoundaries with no symbol provider
│       - Test filterTopLevelSymbols (excludes nested symbols)
│       - Mock vscode.commands.executeCommand for LSP calls
│
└── renderers/
    └── htmlRenderer.test.ts     # MODIFY - add ~50 lines
        - Test separator row insertion at symbol boundaries
        - Test separator CSS generation
        - Test fold placeholder rendering
        - Test combined fold + separator output
```

### Coverage
- Minimum: 80%
- Critical paths: 90%
- Focus areas:
  - Graceful handling of missing LSP providers
  - Symbol filtering (top-level only)
  - Fold range processing
  - HTML integration (separator insertion)

### Manual Testing Checklist
- [ ] Print TypeScript file with collapsed function, `foldedRegions: "collapse"`
- [ ] Print JavaScript with 5 functions, `showSeparators: true` → 4 separators
- [ ] Print Python class file, verify separators between classes
- [ ] Print plain text file with `showSeparators: true` → no errors
- [ ] Print file with nested functions, verify only top-level get separators
- [ ] Verify separator lines are subtle (light gray, not bold)
- [ ] Test combined: folds + separators + syntax highlighting

## AI Implementation Prompt

> **You are implementing code intelligence features for VSPrint, a VS Code extension for professional code printing.**
>
> **Your Task**:
> 1. Create `src/services/codeIntelligence.ts` with:
>    - `CodeIntelligenceService` singleton class
>    - `async getFoldedRanges(uri: vscode.Uri, mode: string): Promise<FoldRange[]>`
>      - If mode === 'expand', return []
>      - If mode === 'collapse', query: `vscode.commands.executeCommand('vscode.executeFoldingRangeProvider', uri)`
>      - Handle undefined response (no provider) → return []
>    - `async getSymbolBoundaries(uri: vscode.Uri): Promise<number[]>`
>      - Query: `vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri)`
>      - Filter symbols: `kind === SymbolKind.Function || Class || Method || Interface`
>      - Filter top-level only (check if `symbol.range.start.line` not inside other symbol)
>      - Return sorted array of line numbers
>    - Interface: `FoldRange { start: number; end: number; kind?: string }`
> 2. Modify `src/commands/printFile.ts`:
>    - Add `uri: vscode.Uri` to `FileMetadata` interface (line 10)
>    - In `extractFileMetadata()` (lines 21-31), add `uri: document.uri`
>    - In `printFileCommand()` (lines 52-66):
>      - After metadata extraction, query code intelligence:
>        ```typescript
>        const foldedRanges = settings.foldedRegions !== 'expand'
>          ? await codeIntelligence.getFoldedRanges(metadata.uri, settings.foldedRegions)
>          : [];
>        const symbolBoundaries = settings.showSeparators
>          ? await codeIntelligence.getSymbolBoundaries(metadata.uri)
>          : [];
>        ```
>      - Pass to `generatePrintHtml(content, metadata, settings, foldedRanges, symbolBoundaries)`
> 3. Modify `src/config/settings.ts`:
>    - Add `foldedRegions: 'expand' | 'collapse' | 'asIs'` to `PrintSettings` (line 6)
>    - Add `showSeparators: boolean` to `PrintSettings` (line 7)
>    - Add defaults: `foldedRegions: 'expand'`, `showSeparators: false` (lines 15-19)
>    - Add getters in `getSettings()` (lines 27-35)
> 4. Modify `package.json`:
>    - Add `vsprint.foldedRegions` with enum: ["expand", "collapse", "asIs"], default: "expand"
>    - Add `vsprint.showSeparators` with type: boolean, default: false
> 5. Modify `src/renderers/htmlRenderer.ts`:
>    - Update `generatePrintHtml()` signature (line 191) to accept `foldedRanges` and `symbolBoundaries`
>    - In `generateStyles()` (lines 28-118), add CSS:
>      ```css
>      .separator td {
>        border-top: 2px solid #e0e0e0;
>        padding-top: 8px;
>      }
>      .fold-placeholder {
>        color: #999;
>        font-style: italic;
>      }
>      ```
>    - In `generateCodeTable()` (lines 159-181):
>      - Accept `symbolBoundaries: number[]` parameter
>      - Before rendering each line, check if `lineNumber` is in `symbolBoundaries`
>      - If yes, insert: `<tr class="separator"><td colspan="2"></td></tr>`
>
> **Worktree**: You are working in `feat-007/` worktree
>
> **Architecture Guidelines**:
> - Follow singleton pattern from `src/utils/logger.ts` for CodeIntelligenceService
> - Use VS Code LSP commands (executeCommand with 'vscode.execute*' commands)
> - Handle missing providers gracefully (return empty arrays, no errors)
> - Keep separator styling subtle (light colors, thin borders)
>
> **Success Criteria**:
> - `npm test -- --grep "codeIntelligence"` passes
> - File with functions shows separators when `showSeparators: true`
> - Collapsed code shows placeholder when `foldedRegions: "collapse"`
> - Plain text files print without errors (no LSP provider)
> - Syntax highlighting is preserved

## Completion Checklist

- [ ] `src/services/codeIntelligence.ts` created
- [ ] `src/commands/printFile.ts` updated to query code intelligence
- [ ] `src/config/settings.ts` updated with new settings
- [ ] `package.json` updated with new configurations
- [ ] `src/renderers/htmlRenderer.ts` integrated with separators and folds
- [ ] CSS for separators and fold placeholders added
- [ ] Tests written and passing (minimum 8 tests)
- [ ] Manual testing complete (TypeScript, JavaScript, Python)
- [ ] Graceful degradation tested (plain text files)
- [ ] PR created against `dev` branch
- [ ] PR reviewed and merged
- [ ] Worktree removed
- [ ] Ticket marked complete

---

## Completion Record

**Completed**: —
**Actual Effort**: —
**PR**: —

### Files Created/Modified
| File | Lines | Purpose |
|------|-------|---------|
| — | — | — |

### Notes
—
