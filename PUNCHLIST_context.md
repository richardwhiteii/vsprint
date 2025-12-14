# VSPrint - VS Code Print Extension - Punchlist Context

**Related Punchlist Parts**: 001, 002, 003
**Last Updated**: 2025-12-14

## Mission Objective

Build a robust VS Code extension that enables developers to print code with professional formatting, syntax highlighting, and flexible output options (physical printer, PDF, HTML). The extension MUST provide a seamless printing experience with customizable layouts, code intelligence features, and accessibility support.

## Key Decisions Made

- **Extension Framework**: VS Code Extension API with TypeScript
- **PDF Generation**: Use `puppeteer` or `playwright` for headless Chrome rendering (high fidelity)
- **Syntax Highlighting**: Leverage VS Code's TextMate grammars or `shiki` for consistent highlighting
- **Print Preview**: WebView panel within VS Code for WYSIWYG preview
- **Configuration**: VS Code settings API with JSON schema for type-safe settings
- **Theming**: CSS-based print themes, separate from editor themes
- **Architecture**: Modular design with separate renderers for each output format

## Prerequisites

### Required Dependencies
- Node.js 18+ and npm/yarn
- VS Code 1.85+ (for latest Extension API features)
- TypeScript 5.0+

### Development Setup
```bash
cd /home/richard/projects/vsprint/dev
npm init -y
npm install -D typescript @types/vscode @types/node vsce esbuild
npm install puppeteer shiki
```

### Required Tools
- `vsce` - VS Code Extension packaging tool
- `esbuild` - Fast bundler for extension code

## Reference Documentation

**Required Reading** (MUST read before starting):
- VS Code Extension API: https://code.visualstudio.com/api
- VS Code WebView API: https://code.visualstudio.com/api/extension-guides/webview
- VS Code Printing: https://code.visualstudio.com/api/references/vscode-api#window
- Shiki Syntax Highlighter: https://shiki.matsu.io/

**Additional Context** (Read if blocked):
- Puppeteer PDF generation: https://pptr.dev/guides/pdf-generation
- TextMate Grammars: https://macromates.com/manual/en/language_grammars
- VS Code Theme Colors: https://code.visualstudio.com/api/references/theme-color

## Git Workflow

### Repository Structure (Bare Repo + Worktrees)
```
/home/richard/projects/vsprint/
├── .bare/          # Bare repo (shared git data)
├── main/           # Stable releases only
├── test/           # QA/integration testing
├── dev/            # Active development
└── feat-XXX/       # Feature worktrees (temporary)
```

### Branch Strategy
| Branch | Purpose | Merges From | Merges To |
|--------|---------|-------------|-----------|
| `main` | Stable releases. Protected. | `test` | — |
| `test` | QA/integration testing | `dev` | `main` |
| `dev` | Active development | `feature/*` | `test` |
| `feature/VSPRINT-XXX-*` | Individual tickets | — | `dev` |

### Flow
```
feature/VSPRINT-XXX → dev → test → main
```

### Workflow Commands

**1. Starting a ticket:**
```bash
cd /home/richard/projects/vsprint
git worktree add feat-XXX -b feature/VSPRINT-XXX-desc dev
code feat-XXX
```

**2. Parallel tickets** (when applicable):
```bash
git worktree add feat-006 -b feature/VSPRINT-006-line-wrap dev
git worktree add feat-007 -b feature/VSPRINT-007-code-intel dev
# Work on both simultaneously in separate VS Code windows
```

**3. Completing a ticket:**
```bash
cd feat-XXX
git push -u origin feature/VSPRINT-XXX-desc
gh pr create --base dev --title "feat: VSPRINT-XXX description"
```

**4. After PR merged to dev:**
```bash
cd /home/richard/projects/vsprint
git worktree remove feat-XXX
cd dev && git pull origin dev
```

**5. Promoting dev → test (after ticket batch complete):**
```bash
cd test
git pull origin test
git merge dev
npm test  # Run full test suite
git push origin test
```

**6. Promoting test → main (after phase complete + QA passed):**
```bash
cd main
git pull origin main
git merge test
git push origin main
git tag vX.Y.Z && git push --tags
```

### Commit Conventions
| Prefix | Use |
|--------|-----|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code restructure (no behavior change) |
| `test:` | Test additions/changes |
| `chore:` | Build, tooling, dependencies |

### Rules
- MUST NOT commit directly to `main` or `test`
- MUST create PR for all features → `dev`
- MUST pass tests before merging to `test`
- MUST pass QA before merging to `main`
- SHOULD squash commits on merge to `dev`
- SHOULD delete feature worktrees after merge
- MAY fast-forward merge from `test` → `main`

## Ticket Configuration

- **Ticket Prefix**: VSPRINT-
- **Tickets Location**: GitHub Issues (created via `github-issue-writer` agent)
- **Local Specs**: `dev/docs/tickets/` (optional, for detailed specs if needed)
- **Story Point Scale**: 1pt (1-2h), 2pt (2-4h), 3pt (4-6h)

### Ticket ID Ranges

| Phase | Tickets | ID Range | Description |
|-------|---------|----------|-------------|
| 1 | 4 | 001-004 | MVP Core Printing |
| 2 | 4 | 005-008 | Enhanced Formatting |
| 3 | 4 | 009-012 | Output Options |
| 4 | 3 | 013-015 | Customization |
| 5 | 4 | 016-019 | Advanced Features |
| 6 | 3 | 020-022 | Polish & Integration |
| **Total** | **22** | **001-022** | Full Implementation |

## Glossary / Key Terms

| Term | Definition |
|------|------------|
| **WebView** | VS Code panel that renders HTML/CSS/JS content |
| **TextMate Grammar** | Syntax definition format used by VS Code for highlighting |
| **Shiki** | Syntax highlighter using VS Code's TextMate grammars |
| **vsce** | Visual Studio Code Extension CLI tool |
| **Extension Host** | VS Code process that runs extensions |
| **Activation Events** | Triggers that cause extension to load |
| **Configuration Contribution** | Extension settings defined in package.json |
| **Disposable** | VS Code pattern for resource cleanup |

## Architecture Overview

```
vsprint/
  src/
    extension.ts           # Entry point, activation
    commands/              # Command handlers
      printFile.ts
      printSelection.ts
      printFolder.ts
    renderers/             # Output format renderers
      htmlRenderer.ts
      pdfRenderer.ts
      printerRenderer.ts
    services/              # Core services
      syntaxHighlighter.ts
      pageLayout.ts
      codeIntelligence.ts
    webview/               # Preview panel
      previewProvider.ts
      preview.html
      preview.css
    config/                # Settings management
      settings.ts
      profiles.ts
    utils/                 # Utilities
      fileUtils.ts
      textUtils.ts
  test/                    # Test files
  package.json             # Extension manifest
  tsconfig.json
  esbuild.config.js
```

## Quality Standards

- **Test Coverage**: MUST achieve 80%+ coverage on core modules
- **Performance**: Large files (10,000+ lines) MUST render in under 5 seconds
- **Accessibility**: MUST support high contrast mode and screen reader metadata
- **Error Handling**: All user-facing errors MUST provide actionable messages

## Constraints

- MUST NOT use mocks in production code because we require real integration testing
- MUST NOT block VS Code UI during PDF generation because users expect responsive IDE
- SHOULD NOT exceed 10MB extension bundle size for fast marketplace downloads
- MUST support VS Code versions 1.85+ for broad compatibility
