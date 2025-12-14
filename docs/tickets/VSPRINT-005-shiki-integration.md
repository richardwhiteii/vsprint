# VSPRINT-005: Enhanced Formatting - Shiki Integration & Theme Support

## Status
- **Status**: [ ] Not Started
- **Assignee**: —
- **Branch**: `feature/VSPRINT-005-shiki-integration`
- **Worktree**: `feat-005/`
- **PR**: —

## Ticket Info
| Field | Value |
|-------|-------|
| **Points** | 3pt |
| **Phase** | Phase 2: Enhanced Formatting |
| **Dependencies** | VSPRINT-004 |
| **Parallel With** | — |
| **Priority** | High |

## Source Reference
- **Punchlist**: `PUNCHLIST_001.md`
- **Phase**: Phase 2 - Enhanced Formatting
- **Tasks**: 2.1, 2.2

## Git Workflow

### Starting This Ticket
```bash
cd /home/richard/projects/vsprint
git worktree add feat-005 -b feature/VSPRINT-005-shiki-integration dev
code feat-005
```

### During Implementation
```bash
cd feat-005
git add -A && git commit -m "feat: VSPRINT-005 add shiki syntax highlighting"
```

### Completing This Ticket
```bash
cd feat-005
git push -u origin feature/VSPRINT-005-shiki-integration
gh pr create --base dev --title "feat: VSPRINT-005 Shiki integration and theme support"
```

### After PR Merged
```bash
cd /home/richard/projects/vsprint
git worktree remove feat-005
cd dev && git pull origin dev
```

### This Ticket Enables Parallel Execution
Once this ticket is merged, VSPRINT-006 and VSPRINT-007 can run in parallel:
```bash
# After VSPRINT-005 merged to dev:
cd /home/richard/projects/vsprint
git worktree add feat-006 -b feature/VSPRINT-006-line-wrapping dev
git worktree add feat-007 -b feature/VSPRINT-007-code-intelligence dev
# Work on both simultaneously in separate VS Code windows
```

## Objective

Integrate Shiki syntax highlighter to add professional syntax highlighting to printed code output. Support multiple themes (light, dark, GitHub themes, Monokai) with print-optimized CSS generation. This foundation enables both line wrapping (VSPRINT-006) and code intelligence (VSPRINT-007) to operate on properly highlighted code.

## Context

Currently, VSPrint renders code as plain text with monospace font and basic styling (see `src/renderers/htmlRenderer.ts` lines 159-181). While functional, this lacks the syntax highlighting developers expect. Phase 1 established the print pipeline: command → HTML renderer → browser print.

This ticket enhances the HTML renderer by integrating Shiki, a syntax highlighter that uses VS Code's TextMate grammars. Shiki generates inline styles (not CSS classes), making it ideal for printing where external stylesheets can be unreliable.

The implementation creates a new `syntaxHighlighter` service that sits between the print command and HTML renderer. It transforms plain text into highlighted HTML spans, which the renderer then wraps in the existing table structure.

Integration points:
- **Modify**: `src/renderers/htmlRenderer.ts` lines 159-181 (code table generation)
- **Create**: `src/services/syntaxHighlighter.ts` (new Shiki service)
- **Modify**: `src/config/settings.ts` lines 6-10 (add theme setting)
- **Modify**: `package.json` lines 43-64 (add theme configuration)

## Implementation Approach

**Why Shiki?**
- Uses VS Code's grammar definitions (consistent highlighting)
- Generates inline styles (print-friendly, no external CSS)
- Supports 100+ languages and themes
- Synchronous API available (no async complexity in render pipeline)

**Architecture:**
1. Create `SyntaxHighlighter` service class with theme loading
2. Map VS Code language IDs to Shiki language IDs (TypeScript → ts, Python → py, etc.)
3. Generate highlighted HTML with `codeToHtml()` API
4. Extract just the `<code>` content (discard Shiki's wrapper HTML)
5. Integrate into `generateCodeTable()` function in HTML renderer

**Performance Consideration:**
Shiki bundles are large (10-20MB). Use dynamic imports for themes to avoid loading all themes upfront. Cache loaded themes in memory.

## Technical Requirements

**Constraints:**
- MUST use Shiki's synchronous `getHighlighter()` API to avoid promise complexity
- MUST generate inline styles (not CSS classes) for print reliability
- MUST handle unknown languages gracefully (fallback to plain text)
- MUST preserve existing line number alignment in table layout
- MUST support both light and dark themes with print-optimized CSS
- SHOULD cache theme instances to avoid repeated loading
- SHOULD map common VS Code language IDs to Shiki IDs
- MAY support custom theme paths in settings for advanced users

### Source File References

```
File: /home/richard/projects/vsprint/dev/src/renderers/htmlRenderer.ts
Lines: 159-181 - generateCodeTable function
  Currently generates plain text table with escapeHtml.
  Needs modification to accept highlighted HTML from Shiki.

Lines: 28-118 - generateStyles function
  CSS needs theme-aware background/foreground colors.
  Add theme parameter to generate appropriate print styles.

Lines: 191-215 - generatePrintHtml entry point
  Add syntax highlighting step before calling generateCodeTable.
```

```
File: /home/richard/projects/vsprint/dev/src/config/settings.ts
Lines: 6-10 - PrintSettings interface
  Add `theme: string` property.

Lines: 15-19 - DEFAULT_SETTINGS
  Add `theme: 'github-light'` as default.

Lines: 27-35 - getSettings function
  Add theme retrieval with fallback.
```

```
File: /home/richard/projects/vsprint/dev/package.json
Lines: 43-64 - configuration.properties
  Add vsprint.theme setting with enum values.
```

### Files to Create/Modify

```
src/
├── services/
│   └── syntaxHighlighter.ts    # CREATE - ~250 lines
│       - SyntaxHighlighter class
│       - Theme loading and caching
│       - Language ID mapping
│       - Highlighted HTML generation
│
├── renderers/
│   └── htmlRenderer.ts          # MODIFY lines 28-118, 159-181, 191-215
│       - Add theme parameter to generateStyles
│       - Accept highlighted HTML in generateCodeTable
│       - Integrate syntax highlighting in generatePrintHtml
│
├── config/
│   └── settings.ts              # MODIFY lines 6-10, 15-19, 27-35
│       - Add theme property to PrintSettings
│       - Add theme to defaults
│       - Add theme getter
│
└── commands/
    └── printFile.ts             # MODIFY lines 61-63
        - Pass languageId to HTML generator

package.json                     # MODIFY lines 43-64
  - Add vsprint.theme configuration
  - Add enum: light, dark, github-light, github-dark, monokai

package.json                     # MODIFY dependencies section
  - Add: "shiki": "^1.0.0"
```

## Acceptance Criteria

#### AC1: Syntax Highlighting for Supported Languages
- **Given** a TypeScript file with keywords, strings, and comments
- **When** user runs "VSPrint: Print File"
- **Then** printed output has distinct colors for keywords (blue), strings (red), comments (green)
- **And** colors match the selected theme's color scheme

#### AC2: Theme Selection
- **Given** user sets `vsprint.theme` to "github-dark"
- **When** printing any supported file type
- **Then** output uses dark background with light text
- **And** print CSS includes dark theme colors

#### AC3: Unknown Language Fallback
- **Given** a file with language ID "unknown" or unsupported by Shiki
- **When** printing the file
- **Then** output renders as plain text without syntax highlighting
- **And** no errors are thrown or displayed to user

#### AC4: Language ID Mapping
- **Given** files with VS Code language IDs: "typescript", "python", "javascript", "go", "rust"
- **When** printing each file type
- **Then** Shiki correctly maps to: "ts", "py", "js", "go", "rust"
- **And** syntax highlighting is accurate for each language

#### AC5: Line Number Preservation
- **Given** a highlighted code file with 50 lines
- **When** printing with line numbers enabled
- **Then** line numbers 1-50 align perfectly with highlighted code
- **And** table layout is identical to Phase 1 output (except with colors)

## Testing Requirements

### Test Commands
```bash
cd feat-005
npm test -- --grep "syntax"
npm test -- --grep "theme"
npm test -- --grep "SyntaxHighlighter"
```

### Test Files to Create
```
test/
└── services/
    └── syntaxHighlighter.test.ts  # CREATE - ~150 lines
        - Test theme loading (light, dark, github-light, github-dark, monokai)
        - Test language mapping (typescript → ts, python → py, etc.)
        - Test unknown language fallback
        - Test highlighted HTML contains <span> tags
        - Test theme caching (same theme loaded once)
```

### Coverage
- Minimum: 80%
- Critical paths: 90%
- Focus areas:
  - Theme loading and caching logic
  - Language ID mapping
  - Unknown language fallback
  - HTML integration points

### Manual Testing Checklist
- [ ] Print TypeScript file with `github-light` theme
- [ ] Print Python file with `monokai` theme
- [ ] Print JavaScript file with `github-dark` theme
- [ ] Print unknown file type (e.g., `.log` file)
- [ ] Verify line numbers still align
- [ ] Test with light theme and dark theme
- [ ] Verify print CSS includes theme colors

## AI Implementation Prompt

> **You are implementing Shiki syntax highlighting for VSPrint, a VS Code extension for professional code printing.**
>
> **Your Task**:
> 1. Install `shiki` package
> 2. Create `src/services/syntaxHighlighter.ts` with:
>    - `SyntaxHighlighter` class
>    - `getHighlighter()` wrapper with theme loading
>    - Language mapping: VS Code IDs → Shiki IDs (typescript→ts, python→py, javascript→js, go→go, rust→rust)
>    - `highlight(code: string, languageId: string, theme: string): string` method
>    - Unknown language fallback to plain text
>    - Theme caching in memory
> 3. Modify `src/config/settings.ts`:
>    - Add `theme: string` to `PrintSettings` interface (line 6)
>    - Add `theme: 'github-light'` to `DEFAULT_SETTINGS` (line 15)
>    - Add theme getter in `getSettings()` (line 31)
> 4. Modify `package.json`:
>    - Add `"shiki": "^1.0.0"` to dependencies
>    - Add `vsprint.theme` configuration (after line 62) with enum: ["light", "dark", "github-light", "github-dark", "monokai"]
> 5. Modify `src/renderers/htmlRenderer.ts`:
>    - Import `SyntaxHighlighter` service
>    - Modify `generateCodeTable()` (lines 159-181) to accept pre-highlighted HTML
>    - Modify `generatePrintHtml()` (lines 191-215) to call syntax highlighter before rendering
>    - Add theme colors to CSS in `generateStyles()` (lines 28-118)
> 6. Modify `src/commands/printFile.ts`:
>    - Pass `metadata.languageId` to HTML renderer (line 62)
>
> **Worktree**: You are working in `feat-005/` worktree
>
> **Architecture Guidelines**:
> - Follow patterns in `src/renderers/htmlRenderer.ts` (functional approach, small focused functions)
> - Use singleton pattern for `SyntaxHighlighter` (see `src/utils/logger.ts` lines 7-70 for reference)
> - Generate inline styles (Shiki default) NOT CSS classes
> - Preserve existing table structure in `htmlRenderer.ts`
>
> **Success Criteria**:
> - `npm test -- --grep "syntax"` passes
> - TypeScript file prints with colored keywords, strings, comments
> - Unknown language files print without errors
> - Theme changes are reflected in output
> - Line numbers still align perfectly

## Completion Checklist

- [ ] `shiki` package installed
- [ ] `src/services/syntaxHighlighter.ts` created
- [ ] `src/config/settings.ts` updated with theme setting
- [ ] `package.json` updated with theme configuration
- [ ] `src/renderers/htmlRenderer.ts` integrated with Shiki
- [ ] `src/commands/printFile.ts` passes language ID
- [ ] Tests written and passing (minimum 8 tests)
- [ ] Manual testing complete (TypeScript, Python, JavaScript)
- [ ] Unknown language fallback tested
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
