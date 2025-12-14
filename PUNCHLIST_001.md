# VSPrint Punchlist - Part 1 of 3

> **IMPORTANT**: Read `PUNCHLIST_context.md` first for full context.

**Status**: Not Started
**This Part Contains**: Phases 1-2 (MVP Core + Enhanced Formatting)
**Last Updated**: 2025-12-14

### Punchlist Navigation

| Part | Phases | Status | File |
|------|--------|--------|------|
| ctx | Context | N/A | `PUNCHLIST_context.md` <-- READ FIRST |
| **1** | **1-2** | **Not Started** | `PUNCHLIST_001.md` <-- YOU ARE HERE |
| 2 | 3-4 | Not Started | `PUNCHLIST_002.md` |
| 3 | 5-6 | Not Started | `PUNCHLIST_003.md` |

---

## Implementation Progress Tracker

**Overall Progress**: 0/6 Phases Complete (0%)
**Current Phase**: Phase 1 - MVP Core Printing
**Last Activity**: 2025-12-14 - Punchlist created
**Next Action**: Initialize extension project structure with package.json

### Status Legend
- [ ] Not Started
- [~] In Progress
- [x] Complete
- [!] Blocked
- [-] Skipped

### Phase Status Overview

| Phase | Component | Status | Complexity | Estimated | Files | Tests | Notes |
|-------|-----------|--------|------------|-----------|-------|-------|-------|
| 1 | MVP Core Printing | [ ] | Medium | 4 hours | 8 | 12 | Foundation |
| 2 | Enhanced Formatting | [ ] | Medium | 4 hours | 6 | 15 | Syntax + Intelligence |
| 3 | Output Options | [ ] | High | 5 hours | 7 | 18 | PDF/HTML/Preview |
| 4 | Customization | [ ] | Medium | 4 hours | 5 | 12 | Themes/Profiles |
| 5 | Advanced Features | [ ] | High | 5 hours | 8 | 20 | Diff/Notebooks |
| 6 | Polish & Integration | [ ] | Medium | 4 hours | 6 | 15 | Performance/API |

---

## Quick Start Guide for New Context

If resuming in a new context window:
1. Check "Overall Progress" above to see completion percentage
2. Find "Current Phase" to know where to resume
3. Review "Next Action" for immediate task
4. Check Phase Status checkboxes to see what's done
5. Read "Blockers" section in current phase for any impediments
6. Use subagents for implementation to preserve main context
7. Read `PUNCHLIST_context.md` for architecture and glossary

---

## Update Instructions

When completing tasks, update the following:
1. Phase status in table ([ ] -> [~] -> [x])
2. Checkboxes for completed items within phase
3. "Overall Progress" percentage in tracker
4. "Current Phase" field when advancing
5. "Last Activity" with timestamp and description
6. "Next Action" with the next task
7. Test counts in Phase Status Overview table
8. Commit changes to punchlist after each phase

---

## Phase 1: MVP Core Printing (4 hours)

**Status**: [ ] Not Started
**Blockers**: None

### Objective
Create a functional VS Code extension that can print the active file to the system printer with basic formatting (line numbers, monospace font, simple header/footer).

### Tasks

#### 1.1 Project Initialization
- [ ] Create `package.json` with extension manifest
- [ ] Create `tsconfig.json` for TypeScript configuration
- [ ] Create `esbuild.config.js` for bundling
- [ ] Set up `src/` directory structure per architecture
- [ ] Install dependencies: `typescript`, `@types/vscode`, `@types/node`, `esbuild`

#### 1.2 Extension Entry Point
- [ ] Create `src/extension.ts` with `activate()` and `deactivate()` functions
- [ ] Register activation event `onCommand:vsprint.printFile`
- [ ] Implement basic command registration pattern
- [ ] Add extension context disposal handling

#### 1.3 Print File Command
- [ ] Create `src/commands/printFile.ts`
- [ ] Get active text editor content via `vscode.window.activeTextEditor`
- [ ] Handle case when no file is open (show error message)
- [ ] Extract file metadata (name, path, language)

#### 1.4 Basic HTML Renderer
- [ ] Create `src/renderers/htmlRenderer.ts`
- [ ] Generate HTML with monospace font (Consolas, Monaco, monospace)
- [ ] Add line numbers as HTML list or table
- [ ] Include filename in header, page number placeholder in footer
- [ ] Apply basic CSS for print media

#### 1.5 System Printer Integration
- [ ] Create `src/renderers/printerRenderer.ts`
- [ ] Open print dialog using child process or VS Code API
- [ ] Handle cross-platform differences (Windows, macOS, Linux)
- [ ] Implement fallback: generate temp HTML and open in browser for printing

#### 1.6 Configuration Foundation
- [ ] Create `src/config/settings.ts` for settings access
- [ ] Add contribution point in `package.json` for settings
- [ ] Define initial settings: `fontSize`, `showLineNumbers`, `fontFamily`
- [ ] Implement settings getter with defaults

#### 1.7 Basic Commands Registration
- [ ] Register `vsprint.printFile` command
- [ ] Register `vsprint.printSelection` command (placeholder)
- [ ] Add commands to Command Palette via `package.json` contributes
- [ ] Add context menu contribution for editor

### Files to Create/Modify

| File | Size Est. | Purpose |
|------|-----------|---------|
| `package.json` | ~150 lines | Extension manifest, dependencies, contributions |
| `tsconfig.json` | ~30 lines | TypeScript configuration |
| `esbuild.config.js` | ~40 lines | Build configuration |
| `src/extension.ts` | ~80 lines | Entry point, command registration |
| `src/commands/printFile.ts` | ~100 lines | Print file command handler |
| `src/renderers/htmlRenderer.ts` | ~150 lines | HTML generation for print |
| `src/renderers/printerRenderer.ts` | ~120 lines | System printer integration |
| `src/config/settings.ts` | ~60 lines | Settings access layer |

### Recommended Tickets

| Ticket | Points | Scope | Dependencies |
|--------|--------|-------|--------------|
| VSPRINT-001 | 2pt | Project setup, package.json, tsconfig, esbuild | None |
| VSPRINT-002 | 2pt | Extension entry point, command registration | VSPRINT-001 |
| VSPRINT-003 | 2pt | HTML renderer with line numbers and basic styling | VSPRINT-002 |
| VSPRINT-004 | 2pt | System printer integration, cross-platform | VSPRINT-003 |

**Ticket Generation**:
```
ticket-writer punchlist=./PUNCHLIST_001.md phase=1 prefix=VSPRINT range=001-004
```

### Success Criteria (Given-When-Then)

- [ ] Given a file is open in the editor, When user runs "VSPrint: Print File" command, Then print dialog opens with formatted content
- [ ] Given no file is open, When user runs print command, Then informative error message is displayed
- [ ] Given user has configured font size in settings, When printing, Then output uses configured font size
- [ ] Given a file with 100+ lines, When printing, Then all lines have correct line numbers
- [ ] All tests pass: `npm test`

### Validation Checkpoint

Before proceeding to Phase 2:
- [ ] All tasks checked off
- [ ] Extension activates without errors
- [ ] Print command appears in Command Palette
- [ ] Basic print to system printer works on at least one platform
- [ ] Tests passing: 12 tests
- [ ] Code committed with message: "feat: MVP core printing functionality"

### Notes
- Windows uses different print APIs than macOS/Linux
- For MVP, browser-based printing fallback is acceptable
- Line numbers MUST align properly with code lines
- Consider using `<table>` for line number + code layout to ensure alignment

---

## Phase 2: Enhanced Formatting (4 hours)

**Status**: [ ] Not Started
**Blockers**: Phase 1 must be complete

### Objective
Add syntax highlighting using Shiki, implement code intelligence features (fold-aware printing, function separators), and enhance layout options (line wrapping, whitespace visualization).

### Tasks

#### 2.1 Syntax Highlighting with Shiki
- [ ] Install `shiki` package
- [ ] Create `src/services/syntaxHighlighter.ts`
- [ ] Load appropriate theme based on configuration
- [ ] Map VS Code language IDs to Shiki language IDs
- [ ] Generate highlighted HTML spans with inline styles
- [ ] Handle unknown languages gracefully (plain text fallback)

#### 2.2 Theme Support
- [ ] Add setting `vsprint.theme` with options: `light`, `dark`, `github-light`, `github-dark`, `monokai`
- [ ] Create theme loading function in syntaxHighlighter
- [ ] Support custom theme paths in settings
- [ ] Generate print-optimized CSS for each theme

#### 2.3 Line Wrapping Options
- [ ] Add setting `vsprint.lineWrap`: `none`, `soft`, `hard`
- [ ] Implement CSS for soft wrap (preserve word boundaries)
- [ ] Implement line continuation indicators for wrapped lines
- [ ] Handle indentation preservation on wrapped lines

#### 2.4 Whitespace Visualization
- [ ] Add setting `vsprint.showWhitespace`: `none`, `boundary`, `all`
- [ ] Render spaces as middle dots when enabled
- [ ] Render tabs as arrows or consistent markers
- [ ] Style whitespace markers subtly (light gray)

#### 2.5 Code Intelligence - Fold Awareness
- [ ] Create `src/services/codeIntelligence.ts`
- [ ] Read folding ranges from VS Code API
- [ ] Add setting `vsprint.foldedRegions`: `expand`, `collapse`, `asIs`
- [ ] Generate collapsed region placeholders when printing folded
- [ ] Include fold level indicators

#### 2.6 Function/Class Separators
- [ ] Parse document symbols via `vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider')`
- [ ] Identify function and class boundaries
- [ ] Insert visual separator lines between major code blocks
- [ ] Add setting `vsprint.showSeparators`: boolean

#### 2.7 Import Section Grouping
- [ ] Detect import statements by language-specific patterns
- [ ] Add visual separator after import block
- [ ] Support JavaScript, TypeScript, Python, Java, Go, Rust

#### 2.8 Enhanced HTML Renderer Integration
- [ ] Integrate syntax highlighter into HTML renderer
- [ ] Apply line wrap settings to output
- [ ] Include whitespace markers in output
- [ ] Add separator lines at symbol boundaries

### Files to Create/Modify

| File | Size Est. | Purpose |
|------|-----------|---------|
| `src/services/syntaxHighlighter.ts` | ~200 lines | Shiki-based highlighting |
| `src/services/codeIntelligence.ts` | ~180 lines | Fold/symbol analysis |
| `src/renderers/htmlRenderer.ts` | +100 lines | Enhance with highlighting |
| `src/config/settings.ts` | +40 lines | New settings definitions |
| `package.json` | +30 lines | New settings contributions |
| `src/themes/` | ~4 files | Print theme CSS files |

### Recommended Tickets

| Ticket | Points | Scope | Dependencies | Parallel |
|--------|--------|-------|--------------|----------|
| VSPRINT-005 | 3pt | Shiki integration, theme support | VSPRINT-004 | - |
| VSPRINT-006 | 2pt | Line wrapping, whitespace visualization | VSPRINT-005 | **006+007** |
| VSPRINT-007 | 2pt | Code intelligence: folds, symbols | VSPRINT-005 | **006+007** |
| VSPRINT-008 | 1pt | Function separators, import grouping | VSPRINT-007 | - |

> **Parallel Execution**: VSPRINT-006 and VSPRINT-007 can run in parallel using separate worktrees.
> Both depend only on VSPRINT-005 (Shiki integration). No shared code between them.
> - 006: Line wrapping, whitespace visualization
> - 007: Code intelligence (folds, symbols)

**Worktree Setup for Parallel Execution**:
```bash
# Orchestration from project root: /home/richard/projects/vsprint

# After VSPRINT-005 is complete, create parallel worktrees:
cd /home/richard/projects/vsprint
git worktree add feat-006 -b feature/VSPRINT-006-line-wrapping dev
git worktree add feat-007 -b feature/VSPRINT-007-code-intelligence dev

# Run agents in parallel:
# Agent 1 -> /home/richard/projects/vsprint/feat-006 (works on VSPRINT-006)
# Agent 2 -> /home/richard/projects/vsprint/feat-007 (works on VSPRINT-007)

# When both complete, create PRs targeting dev:
cd /home/richard/projects/vsprint/feat-006
git push -u origin feature/VSPRINT-006-line-wrapping
gh pr create --base dev --title "feat: VSPRINT-006 line wrapping"

cd /home/richard/projects/vsprint/feat-007
git push -u origin feature/VSPRINT-007-code-intelligence
gh pr create --base dev --title "feat: VSPRINT-007 code intelligence"

# After PRs merged to dev, cleanup worktrees:
cd /home/richard/projects/vsprint
git worktree remove feat-006
git worktree remove feat-007
cd dev && git pull origin dev
```

**Ticket Generation**:
```
ticket-writer punchlist=./PUNCHLIST_001.md phase=2 prefix=VSPRINT range=005-008
```

### Success Criteria (Given-When-Then)

- [ ] Given a TypeScript file, When printing with syntax highlighting enabled, Then keywords, strings, and comments have distinct colors
- [ ] Given a file with long lines, When line wrap is set to "soft", Then lines wrap at word boundaries with continuation indicators
- [ ] Given whitespace visualization is enabled, When printing, Then spaces and tabs are visibly marked
- [ ] Given a file with collapsed regions, When foldedRegions is "collapse", Then collapsed content shows placeholder
- [ ] Given a Python file with classes, When separators enabled, Then visual lines appear between class definitions
- [ ] All tests pass: `npm test`

### Validation Checkpoint

Before proceeding to Phase 3:
- [ ] All tasks checked off
- [ ] Syntax highlighting works for at least 5 languages
- [ ] Line wrapping respects configuration
- [ ] Whitespace visualization is subtle but visible
- [ ] Tests passing: 15 tests (cumulative: 27)
- [ ] Code committed with message: "feat: syntax highlighting and code intelligence"

### Notes
- Shiki bundles are large; consider lazy loading themes
- Fold ranges API may return empty for unsupported languages
- Symbol provider may not be available for all file types - handle gracefully
- Performance: syntax highlighting can be slow for very large files (>5000 lines)
