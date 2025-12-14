# VSPrint Punchlist - Part 2 of 3

> **IMPORTANT**: Read `PUNCHLIST_context.md` first for full context.

**Status**: Not Started
**This Part Contains**: Phases 3-4 (Output Options + Customization)
**Last Updated**: 2025-12-14

### Punchlist Navigation

| Part | Phases | Status | File |
|------|--------|--------|------|
| ctx | Context | N/A | `PUNCHLIST_context.md` <-- READ FIRST |
| 1 | 1-2 | Not Started | `PUNCHLIST_001.md` |
| **2** | **3-4** | **Not Started** | `PUNCHLIST_002.md` <-- YOU ARE HERE |
| 3 | 5-6 | Not Started | `PUNCHLIST_003.md` |

---

## Phase 3: Output Options (5 hours)

**Status**: [ ] Not Started
**Blockers**: Phase 2 must be complete

### Objective
Implement PDF export using Puppeteer, HTML export for sharing, and a live preview WebView panel within VS Code. Add page layout controls (margins, orientation, paper size, columns).

### Tasks

#### 3.1 PDF Renderer with Puppeteer
- [ ] Install `puppeteer` package
- [ ] Create `src/renderers/pdfRenderer.ts`
- [ ] Launch headless Chrome instance
- [ ] Convert HTML to PDF with `page.pdf()` method
- [ ] Implement proper cleanup of browser instance
- [ ] Handle PDF generation errors gracefully

#### 3.2 PDF Configuration Options
- [ ] Add setting `vsprint.pdf.margins` (top, bottom, left, right in mm)
- [ ] Add setting `vsprint.pdf.orientation`: `portrait`, `landscape`
- [ ] Add setting `vsprint.pdf.paperSize`: `A4`, `Letter`, `Legal`, `custom`
- [ ] Add setting `vsprint.pdf.customSize` for custom dimensions
- [ ] Apply configurations to Puppeteer PDF options

#### 3.3 HTML Export
- [ ] Create `src/commands/exportHtml.ts`
- [ ] Generate standalone HTML with embedded CSS
- [ ] Include all fonts and styles inline
- [ ] Prompt user for save location via `vscode.window.showSaveDialog`
- [ ] Write file to disk

#### 3.4 Print Preview WebView
- [ ] Create `src/webview/previewProvider.ts`
- [ ] Implement `WebviewViewProvider` interface
- [ ] Create `src/webview/preview.html` template
- [ ] Create `src/webview/preview.css` styles
- [ ] Register WebView panel in package.json

#### 3.5 Preview Interactivity
- [ ] Implement zoom controls (50%, 75%, 100%, 125%, 150%, 200%)
- [ ] Add page navigation for multi-page documents
- [ ] Show page count indicator
- [ ] Implement refresh on document change
- [ ] Add "Print" and "Export PDF" buttons in preview

#### 3.6 Page Layout Service
- [ ] Create `src/services/pageLayout.ts`
- [ ] Calculate page breaks based on content height
- [ ] Implement header/footer template rendering
- [ ] Support page numbering: "Page X of Y"
- [ ] Handle orphan/widow control for code blocks

#### 3.7 Multi-Column Layout
- [ ] Add setting `vsprint.columns`: 1, 2, 4
- [ ] Implement CSS multi-column layout
- [ ] Handle column balancing
- [ ] Adjust font size for multi-column (smaller for 2-up, smaller still for 4-up)

#### 3.8 Headers and Footers
- [ ] Add setting `vsprint.header.template` with placeholders
- [ ] Add setting `vsprint.footer.template` with placeholders
- [ ] Support placeholders: `{filename}`, `{filepath}`, `{date}`, `{time}`, `{page}`, `{pages}`
- [ ] Render headers/footers in HTML and PDF output

### Files to Create/Modify

| File | Size Est. | Purpose |
|------|-----------|---------|
| `src/renderers/pdfRenderer.ts` | ~180 lines | Puppeteer PDF generation |
| `src/commands/exportHtml.ts` | ~80 lines | HTML export command |
| `src/webview/previewProvider.ts` | ~250 lines | WebView panel provider |
| `src/webview/preview.html` | ~100 lines | Preview template |
| `src/webview/preview.css` | ~150 lines | Preview styles |
| `src/services/pageLayout.ts` | ~200 lines | Page layout calculations |
| `package.json` | +50 lines | WebView contribution, settings |

### Recommended Tickets

| Ticket | Points | Scope | Dependencies | Parallel |
|--------|--------|-------|--------------|----------|
| VSPRINT-009 | 3pt | Puppeteer PDF renderer with options | VSPRINT-008 | **009+010** |
| VSPRINT-010 | 2pt | HTML export, standalone file | VSPRINT-008 | **009+010** |
| VSPRINT-011 | 3pt | WebView preview panel with controls | VSPRINT-009 | - |
| VSPRINT-012 | 2pt | Page layout, headers/footers, columns | VSPRINT-011 | - |

> **Parallel Execution**: VSPRINT-009 and VSPRINT-010 can run in parallel using separate worktrees.
> Both depend only on VSPRINT-008. Different output formats with no shared code.
> - 009: Puppeteer PDF renderer
> - 010: HTML export

**Worktree Setup for Parallel Execution**:
```bash
# Orchestration from project root: /home/richard/projects/vsprint

# After VSPRINT-008 is complete, create parallel worktrees:
cd /home/richard/projects/vsprint
git worktree add feat-009 -b feature/VSPRINT-009-pdf-renderer dev
git worktree add feat-010 -b feature/VSPRINT-010-html-export dev

# Run agents in parallel:
# Agent 1 -> /home/richard/projects/vsprint/feat-009 (works on VSPRINT-009)
# Agent 2 -> /home/richard/projects/vsprint/feat-010 (works on VSPRINT-010)

# When both complete, create PRs targeting dev:
cd /home/richard/projects/vsprint/feat-009
git push -u origin feature/VSPRINT-009-pdf-renderer
gh pr create --base dev --title "feat: VSPRINT-009 PDF renderer"

cd /home/richard/projects/vsprint/feat-010
git push -u origin feature/VSPRINT-010-html-export
gh pr create --base dev --title "feat: VSPRINT-010 HTML export"

# After PRs merged to dev, cleanup worktrees:
cd /home/richard/projects/vsprint
git worktree remove feat-009
git worktree remove feat-010
cd dev && git pull origin dev
```

**Ticket Generation**:
```
ticket-writer punchlist=./PUNCHLIST_002.md phase=3 prefix=VSPRINT range=009-012
```

### Success Criteria (Given-When-Then)

- [ ] Given a file is open, When user runs "Export to PDF", Then PDF file is saved with syntax highlighting preserved
- [ ] Given PDF margins are configured to 20mm, When exporting, Then PDF has correct margins
- [ ] Given user opens print preview, When file content changes, Then preview updates automatically
- [ ] Given a 200-line file with 2-column layout, When previewing, Then code is displayed in two balanced columns
- [ ] Given header template "{filename} - {date}", When printing, Then each page shows filename and current date
- [ ] All tests pass: `npm test`

### Validation Checkpoint

Before proceeding to Phase 4:
- [ ] All tasks checked off
- [ ] PDF export works with all configured options
- [ ] HTML export produces valid standalone file
- [ ] Preview panel renders correctly in VS Code
- [ ] Tests passing: 18 tests (cumulative: 45)
- [ ] Code committed with message: "feat: PDF/HTML export and live preview"

### Notes
- Puppeteer downloads Chromium (~300MB) on first install
- Consider using `puppeteer-core` with system Chrome for smaller bundle
- WebView must handle VS Code theme changes
- PDF generation SHOULD run in background to avoid UI blocking

---

## Phase 4: Customization (4 hours)

**Status**: [ ] Not Started
**Blockers**: Phase 3 must be complete

### Objective
Implement print profiles for saving/loading configurations, custom CSS themes, watermarks, company branding, and file/folder exclusion patterns.

### Tasks

#### 4.1 Print Profiles System
- [ ] Create `src/config/profiles.ts`
- [ ] Define profile schema (all print settings in one object)
- [ ] Implement profile save to VS Code global state or workspace settings
- [ ] Implement profile load and apply
- [ ] Add commands: `vsprint.saveProfile`, `vsprint.loadProfile`, `vsprint.deleteProfile`

#### 4.2 Profile Quick Picker
- [ ] Create QuickPick UI for profile selection
- [ ] Show profile name and summary (theme, paper size)
- [ ] Support keyboard navigation
- [ ] Add "Create New Profile" option in picker

#### 4.3 Custom CSS Themes
- [ ] Add setting `vsprint.customCss` for path to custom CSS file
- [ ] Load and inject custom CSS into rendered output
- [ ] Validate CSS file exists before applying
- [ ] Provide CSS variable hooks for easy customization

#### 4.4 Built-in Print Themes
- [ ] Create `src/themes/codeReview.css` - optimized for annotations
- [ ] Create `src/themes/minimal.css` - clean, no distractions
- [ ] Create `src/themes/documentation.css` - readable for docs
- [ ] Create `src/themes/grayscale.css` - for B&W printers

#### 4.5 Watermarks
- [ ] Add setting `vsprint.watermark.text`: string
- [ ] Add setting `vsprint.watermark.opacity`: 0.0-1.0
- [ ] Add setting `vsprint.watermark.position`: `center`, `diagonal`, `corner`
- [ ] Implement CSS watermark overlay
- [ ] Support presets: "DRAFT", "CONFIDENTIAL", "INTERNAL"

#### 4.6 Company Branding
- [ ] Add setting `vsprint.branding.logo`: path to image
- [ ] Add setting `vsprint.branding.companyName`: string
- [ ] Add setting `vsprint.branding.position`: `header`, `footer`
- [ ] Embed logo as base64 in output for portability
- [ ] Validate image file exists and is reasonable size

#### 4.7 Exclude Patterns
- [ ] Add setting `vsprint.exclude`: array of glob patterns
- [ ] Implement pattern matching for folder printing
- [ ] Respect `.gitignore` patterns optionally
- [ ] Add setting `vsprint.respectGitignore`: boolean

#### 4.8 Color Scheme Options
- [ ] Add setting `vsprint.colorScheme`: `light`, `dark`, `highContrast`, `grayscale`
- [ ] Implement automatic color inversion for grayscale
- [ ] Adjust syntax highlighting colors per scheme
- [ ] Ensure readability in all schemes

### Files to Create/Modify

| File | Size Est. | Purpose |
|------|-----------|---------|
| `src/config/profiles.ts` | ~200 lines | Profile management |
| `src/themes/codeReview.css` | ~80 lines | Code review theme |
| `src/themes/minimal.css` | ~60 lines | Minimal theme |
| `src/themes/documentation.css` | ~70 lines | Documentation theme |
| `src/themes/grayscale.css` | ~50 lines | Grayscale theme |
| `src/utils/watermark.ts` | ~80 lines | Watermark generation |
| `src/utils/branding.ts` | ~100 lines | Logo/branding handling |
| `package.json` | +60 lines | New settings, commands |

### Recommended Tickets

| Ticket | Points | Scope | Dependencies |
|--------|--------|-------|--------------|
| VSPRINT-013 | 3pt | Profile system: save/load/delete | VSPRINT-012 |
| VSPRINT-014 | 2pt | Custom CSS themes, built-in themes | VSPRINT-013 |
| VSPRINT-015 | 2pt | Watermarks, branding, exclude patterns | VSPRINT-014 |

**Ticket Generation**:
```
ticket-writer punchlist=./PUNCHLIST_002.md phase=4 prefix=VSPRINT range=013-015
```

### Success Criteria (Given-When-Then)

- [ ] Given user configures settings, When "Save Profile" runs with name "CodeReview", Then profile is persisted
- [ ] Given profile "CodeReview" exists, When user selects it from QuickPick, Then all settings are applied
- [ ] Given custom CSS path is set, When printing, Then custom styles are applied
- [ ] Given watermark text is "DRAFT", When printing, Then "DRAFT" appears as overlay on each page
- [ ] Given exclude pattern "*.test.ts", When printing folder, Then test files are excluded
- [ ] All tests pass: `npm test`

### Validation Checkpoint

Before proceeding to Phase 5:
- [ ] All tasks checked off
- [ ] Profiles save and load correctly
- [ ] All built-in themes render properly
- [ ] Watermarks appear correctly positioned
- [ ] Tests passing: 12 tests (cumulative: 57)
- [ ] Code committed with message: "feat: profiles, themes, watermarks, branding"

### Notes
- Profiles SHOULD sync across machines via VS Code Settings Sync
- Logo images SHOULD be resized to reasonable dimensions before embedding
- Watermark opacity MUST be readable but not obstruct code
- Consider profile import/export via JSON for sharing
