# VSPrint Punchlist - Part 3 of 3

> **IMPORTANT**: Read `PUNCHLIST_context.md` first for full context.

**Status**: Not Started
**This Part Contains**: Phases 5-6 (Advanced Features + Polish)
**Last Updated**: 2025-12-14

### Punchlist Navigation

| Part | Phases | Status | File |
|------|--------|--------|------|
| ctx | Context | N/A | `PUNCHLIST_context.md` <-- READ FIRST |
| 1 | 1-2 | Not Started | `PUNCHLIST_001.md` |
| 2 | 3-4 | Not Started | `PUNCHLIST_002.md` |
| **3** | **5-6** | **Not Started** | `PUNCHLIST_003.md` <-- YOU ARE HERE |

---

## Phase 5: Advanced Features (5 hours)

**Status**: [ ] Not Started
**Blockers**: Phase 4 must be complete

### Objective
Implement git diff printing (side-by-side and unified), Jupyter notebook support with output rendering, markdown rendering, accessibility features (high contrast, large print), and QR code generation for file links.

### Tasks

#### 5.1 Git Diff Printing
- [ ] Create `src/commands/printDiff.ts`
- [ ] Use VS Code Git extension API to get diff
- [ ] Support both staged and unstaged changes
- [ ] Implement unified diff format rendering
- [ ] Add line-level change highlighting (green additions, red deletions)

#### 5.2 Side-by-Side Diff View
- [ ] Implement two-column diff layout
- [ ] Align corresponding lines across columns
- [ ] Show line numbers for both old and new versions
- [ ] Color-code changed lines and inline changes
- [ ] Handle added/removed files gracefully

#### 5.3 Git Blame Annotations
- [ ] Create `src/commands/printWithBlame.ts`
- [ ] Fetch blame data via Git extension API
- [ ] Render author name and date in margin
- [ ] Add setting `vsprint.blame.showAuthor`, `vsprint.blame.showDate`
- [ ] Use subtle styling to not overwhelm code

#### 5.4 Jupyter Notebook Support
- [ ] Create `src/renderers/notebookRenderer.ts`
- [ ] Parse `.ipynb` JSON format
- [ ] Render markdown cells as formatted HTML
- [ ] Render code cells with syntax highlighting
- [ ] Include cell outputs (text, images, HTML)
- [ ] Handle large outputs with truncation option

#### 5.5 Markdown Rendering
- [ ] Install `marked` or use VS Code's markdown renderer
- [ ] Create `src/commands/printMarkdown.ts`
- [ ] Render markdown to HTML before printing
- [ ] Support embedded code blocks with syntax highlighting
- [ ] Handle images (inline, base64 encode)

#### 5.6 Accessibility - High Contrast Mode
- [ ] Create `src/themes/highContrast.css`
- [ ] Ensure WCAG AA compliance for color contrast
- [ ] Test with high contrast themes in VS Code
- [ ] Add setting `vsprint.accessibility.highContrast`: boolean

#### 5.7 Accessibility - Large Print
- [ ] Add preset `vsprint.accessibility.largeprint`: boolean
- [ ] When enabled, set minimum font size 16pt
- [ ] Increase line spacing to 1.5
- [ ] Add larger margins for easier handling

#### 5.8 QR Code Generation
- [ ] Install `qrcode` package
- [ ] Create `src/utils/qrcode.ts`
- [ ] Generate QR code linking to file in repository
- [ ] Support GitHub, GitLab, Bitbucket URL patterns
- [ ] Add setting `vsprint.qrcode.enabled`, `vsprint.qrcode.position`

### Files to Create/Modify

| File | Size Est. | Purpose |
|------|-----------|---------|
| `src/commands/printDiff.ts` | ~200 lines | Git diff command |
| `src/renderers/diffRenderer.ts` | ~250 lines | Diff rendering (unified + side-by-side) |
| `src/commands/printWithBlame.ts` | ~120 lines | Blame annotations |
| `src/renderers/notebookRenderer.ts` | ~300 lines | Jupyter notebook rendering |
| `src/commands/printMarkdown.ts` | ~100 lines | Markdown print command |
| `src/themes/highContrast.css` | ~80 lines | High contrast theme |
| `src/utils/qrcode.ts` | ~80 lines | QR code generation |
| `package.json` | +40 lines | New commands, settings |

### Recommended Tickets

| Ticket | Points | Scope | Dependencies | Parallel |
|--------|--------|-------|--------------|----------|
| VSPRINT-016 | 3pt | Git diff printing (unified + side-by-side) | VSPRINT-015 | **016+018** |
| VSPRINT-017 | 2pt | Git blame annotations | VSPRINT-016 | - |
| VSPRINT-018 | 3pt | Jupyter notebook and markdown rendering | VSPRINT-015 | **016+018** |
| VSPRINT-019 | 2pt | Accessibility (high contrast, large print) + QR codes | VSPRINT-018 | - |

> **Parallel Execution**: VSPRINT-016 and VSPRINT-018 can run in parallel using separate worktrees.
> Both depend only on VSPRINT-015. Completely unrelated features with no shared code.
> - 016: Git diff printing
> - 018: Jupyter notebook and markdown rendering

**Worktree Setup for Parallel Execution**:
```bash
# Orchestration from project root: /home/richard/projects/vsprint

# After VSPRINT-015 is complete, create parallel worktrees:
cd /home/richard/projects/vsprint
git worktree add feat-016 -b feature/VSPRINT-016-git-diff dev
git worktree add feat-018 -b feature/VSPRINT-018-notebooks-markdown dev

# Run agents in parallel:
# Agent 1 -> /home/richard/projects/vsprint/feat-016 (works on VSPRINT-016)
# Agent 2 -> /home/richard/projects/vsprint/feat-018 (works on VSPRINT-018)

# When both complete, create PRs targeting dev:
cd /home/richard/projects/vsprint/feat-016
git push -u origin feature/VSPRINT-016-git-diff
gh pr create --base dev --title "feat: VSPRINT-016 git diff printing"

cd /home/richard/projects/vsprint/feat-018
git push -u origin feature/VSPRINT-018-notebooks-markdown
gh pr create --base dev --title "feat: VSPRINT-018 notebooks and markdown"

# After PRs merged to dev, cleanup worktrees:
cd /home/richard/projects/vsprint
git worktree remove feat-016
git worktree remove feat-018
cd dev && git pull origin dev
```

**Ticket Generation**:
```
ticket-writer punchlist=./PUNCHLIST_003.md phase=5 prefix=VSPRINT range=016-019
```

### Success Criteria (Given-When-Then)

- [ ] Given a file with unstaged changes, When "Print Diff" runs, Then additions and deletions are color-coded
- [ ] Given side-by-side diff mode, When printing, Then old and new versions align correctly
- [ ] Given a Jupyter notebook, When printing, Then markdown, code, and outputs render correctly
- [ ] Given a markdown file, When "Print Rendered Markdown" runs, Then formatted HTML is printed
- [ ] Given high contrast mode enabled, When printing, Then all text meets WCAG AA contrast ratio
- [ ] Given QR code enabled, When printing, Then QR code links to repository file URL
- [ ] All tests pass: `npm test`

### Validation Checkpoint

Before proceeding to Phase 6:
- [ ] All tasks checked off
- [ ] Diff printing works for both unified and side-by-side
- [ ] Notebooks render with all cell types
- [ ] Accessibility modes function correctly
- [ ] Tests passing: 20 tests (cumulative: 77)
- [ ] Code committed with message: "feat: diff, notebooks, markdown, accessibility"

### Notes
- Git extension API may not be available if user has no Git installed
- Notebook outputs can be very large (base64 images) - implement size limits
- QR codes SHOULD be optional since not all repos have public URLs
- High contrast mode MUST work with both light and dark base themes

---

## Phase 6: Polish & Integration (4 hours)

**Status**: [ ] Not Started
**Blockers**: Phase 5 must be complete

### Objective
Optimize performance for large files, add progress indicators, implement extension API for other extensions, add comprehensive keyboard shortcuts, and prepare for marketplace publication.

### Tasks

#### 6.1 Large File Performance
- [ ] Implement streaming rendering for files >5000 lines
- [ ] Add chunked processing to avoid UI blocking
- [ ] Use Web Workers for syntax highlighting if needed
- [ ] Implement render caching for unchanged content
- [ ] Add setting `vsprint.performance.maxLines` with warning

#### 6.2 Progress Indicators
- [ ] Use `vscode.window.withProgress` for long operations
- [ ] Show percentage complete for batch operations
- [ ] Add cancel support for PDF generation
- [ ] Display estimated time remaining for large jobs

#### 6.3 Background PDF Generation
- [ ] Move Puppeteer operations to separate process
- [ ] Implement job queue for multiple PDF requests
- [ ] Show notification when PDF is ready
- [ ] Allow user to continue working during generation

#### 6.4 Extension API
- [ ] Create `src/api/extensionApi.ts`
- [ ] Export `print(options)` function for other extensions
- [ ] Export `getPreview(options)` for preview HTML
- [ ] Document API in README
- [ ] Add TypeScript declarations for API

#### 6.5 Context Menu Integration
- [ ] Add "Print" to editor context menu
- [ ] Add "Print" to file explorer context menu (single file)
- [ ] Add "Print Folder" to folder context menu
- [ ] Add "Print Selection" when text is selected
- [ ] Respect `when` clauses for appropriate contexts

#### 6.6 Keyboard Shortcuts
- [ ] Define default shortcuts (Ctrl+Shift+P for print)
- [ ] Add shortcut for print preview (Ctrl+Shift+V+P or similar)
- [ ] Add shortcut for export PDF
- [ ] Document shortcuts in README and package.json

#### 6.7 Settings Sync Support
- [ ] Ensure all settings are sync-compatible
- [ ] Test settings sync across machines
- [ ] Document which settings sync and which don't

#### 6.8 Marketplace Preparation
- [ ] Create `CHANGELOG.md` with version history
- [ ] Update `README.md` with features, screenshots, usage
- [ ] Add extension icon (128x128 PNG)
- [ ] Configure `package.json` publisher, repository, categories
- [ ] Create `.vscodeignore` for package optimization
- [ ] Test extension package with `vsce package`

### Files to Create/Modify

| File | Size Est. | Purpose |
|------|-----------|---------|
| `src/api/extensionApi.ts` | ~100 lines | Public API for extensions |
| `src/utils/performance.ts` | ~150 lines | Performance optimizations |
| `src/utils/progress.ts` | ~80 lines | Progress indicator helpers |
| `CHANGELOG.md` | ~100 lines | Version history |
| `README.md` | ~300 lines | Full documentation |
| `.vscodeignore` | ~20 lines | Package exclusions |
| `package.json` | +30 lines | Shortcuts, menus, publisher |

### Recommended Tickets

| Ticket | Points | Scope | Dependencies |
|--------|--------|-------|--------------|
| VSPRINT-020 | 2pt | Performance: streaming, caching, workers | VSPRINT-019 |
| VSPRINT-021 | 2pt | Progress indicators, background PDF | VSPRINT-020 |
| VSPRINT-022 | 2pt | Extension API, context menus, shortcuts, marketplace prep | VSPRINT-021 |

**Ticket Generation**:
```
ticket-writer punchlist=./PUNCHLIST_003.md phase=6 prefix=VSPRINT range=020-022
```

### Success Criteria (Given-When-Then)

- [ ] Given a 10,000 line file, When printing, Then UI remains responsive and completes in <5 seconds
- [ ] Given PDF export of large file, When running, Then progress bar shows completion percentage
- [ ] Given another extension calls `vsprint.api.print()`, When invoked, Then print operation executes
- [ ] Given user right-clicks file in explorer, When menu opens, Then "Print" option is available
- [ ] Given user presses Ctrl+Shift+P P, When shortcut is triggered, Then print command executes
- [ ] Given `vsce package` is run, Then valid .vsix file is created under 10MB
- [ ] All tests pass: `npm test`

### Validation Checkpoint

Before marking complete:
- [ ] All tasks checked off
- [ ] Performance benchmarks met (10K lines in <5s)
- [ ] Extension API documented and tested
- [ ] All context menus working
- [ ] Tests passing: 15 tests (cumulative: 92)
- [ ] Code committed with message: "feat: performance, API, shortcuts, marketplace ready"
- [ ] Extension packaged successfully

### Notes
- Web Workers have limitations in VS Code extension host
- Extension API should be versioned for future compatibility
- Marketplace requires verified publisher account
- Screenshots in README significantly improve discoverability

---

## Testing Requirements

### Test Commands
```bash
# Unit tests
npm test

# Integration tests (requires VS Code instance)
npm run test:integration

# Full suite with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Coverage Expectations
- Minimum coverage: 80%
- Critical paths (renderers, commands) MUST have 90%+ coverage
- Services SHOULD have 85%+ coverage
- Utilities MAY have 70%+ coverage

### Real Integrations Only
- NO mocks, stubs, or simulations in production code because mock tests are misleading and we require real integration testing
- Tests use actual VS Code API with test harness
- PDF tests generate real PDF files and validate content
- If Puppeteer requires system Chrome, document in Prerequisites

### Test Categories

| Category | Count | Purpose |
|----------|-------|---------|
| Unit | ~60 | Individual function behavior |
| Integration | ~25 | Component interaction |
| E2E | ~7 | Full user workflows |
| **Total** | **~92** | Complete coverage |

---

## Troubleshooting

### Common Issues

#### Puppeteer fails to launch
**Symptoms**: "Failed to launch the browser process"
**Resolution**:
1. Ensure Chrome/Chromium is installed
2. Try `puppeteer-core` with system Chrome path
3. Check for missing system dependencies on Linux
4. Verify sufficient disk space for browser download

#### Syntax highlighting not working
**Symptoms**: Code prints without colors
**Resolution**:
1. Verify Shiki is installed and loaded
2. Check language ID mapping in syntaxHighlighter
3. Ensure theme is loaded correctly
4. Test with known language (JavaScript, Python)

#### Extension not activating
**Symptoms**: Commands not appearing in palette
**Resolution**:
1. Check activation events in package.json
2. Verify extension compiles without errors
3. Check Output panel for extension host errors
4. Reload VS Code window

#### WebView not displaying
**Symptoms**: Preview panel is blank
**Resolution**:
1. Check Content Security Policy settings
2. Verify HTML template is valid
3. Check browser console for JavaScript errors
4. Ensure WebView provider is registered

#### Large file printing hangs
**Symptoms**: VS Code becomes unresponsive
**Resolution**:
1. Enable streaming mode for large files
2. Increase `vsprint.performance.maxLines` warning threshold
3. Consider chunked rendering
4. Check available memory

---

## Completion Summary

**Completed**: [Date - fill when done]
**Final Status**: [Complete | Partial - reason]

### What Was Built
- [ ] **Phase 1**: Core printing to system printer
- [ ] **Phase 2**: Syntax highlighting, code intelligence
- [ ] **Phase 3**: PDF/HTML export, live preview
- [ ] **Phase 4**: Profiles, themes, watermarks, branding
- [ ] **Phase 5**: Git diff, notebooks, markdown, accessibility
- [ ] **Phase 6**: Performance, API, marketplace ready

### Test Results
- Total tests: [X]
- Passing: [X]
- Coverage: [X%]

### Ticket Generation Status
- **Total Phases**: 6
- **Estimated Tickets**: 22 total
- **Ticket Prefix**: VSPRINT-
- **Next Step**: Run ticket-writer agents in parallel (see commands below)

| Phase | ID Range | Tickets | Status |
|-------|----------|---------|--------|
| 1 | 001-004 | 4 | [ ] Not Generated |
| 2 | 005-008 | 4 | [ ] Not Generated |
| 3 | 009-012 | 4 | [ ] Not Generated |
| 4 | 013-015 | 3 | [ ] Not Generated |
| 5 | 016-019 | 4 | [ ] Not Generated |
| 6 | 020-022 | 3 | [ ] Not Generated |

### Parallel Ticket Generation Commands

Run these ticket-writer agents in parallel for high-quality ticket creation:

```
# All phases in parallel - each agent handles ONE phase
Task(subagent_type="ticket-writer", prompt="punchlist=./PUNCHLIST_001.md phase=1 prefix=VSPRINT range=001-004")
Task(subagent_type="ticket-writer", prompt="punchlist=./PUNCHLIST_001.md phase=2 prefix=VSPRINT range=005-008")
Task(subagent_type="ticket-writer", prompt="punchlist=./PUNCHLIST_002.md phase=3 prefix=VSPRINT range=009-012")
Task(subagent_type="ticket-writer", prompt="punchlist=./PUNCHLIST_002.md phase=4 prefix=VSPRINT range=013-015")
Task(subagent_type="ticket-writer", prompt="punchlist=./PUNCHLIST_003.md phase=5 prefix=VSPRINT range=016-019")
Task(subagent_type="ticket-writer", prompt="punchlist=./PUNCHLIST_003.md phase=6 prefix=VSPRINT range=020-022")
```

### Final Deliverables
- [ ] Extension package (.vsix file)
- [ ] Published to VS Code Marketplace
- [ ] README with screenshots
- [ ] CHANGELOG with version history
- [ ] API documentation

### Handoff Notes for Next AI Agent
- Extension uses esbuild for bundling - run `npm run build` before testing
- Puppeteer may require system dependencies on Linux - check docs
- Settings sync relies on VS Code's built-in sync mechanism
- Test on Windows, macOS, and Linux before publishing
- Consider adding localization (i18n) in future version
