# VSPRINT-006: Enhanced Formatting - Line Wrapping & Whitespace Visualization

## Status
- **Status**: [ ] Not Started
- **Assignee**: —
- **Branch**: `feature/VSPRINT-006-line-wrapping`
- **Worktree**: `feat-006/`
- **PR**: —

## Ticket Info
| Field | Value |
|-------|-------|
| **Points** | 2pt |
| **Phase** | Phase 2: Enhanced Formatting |
| **Dependencies** | VSPRINT-005 |
| **Parallel With** | VSPRINT-007 |
| **Priority** | Medium |

## Source Reference
- **Punchlist**: `PUNCHLIST_001.md`
- **Phase**: Phase 2 - Enhanced Formatting
- **Tasks**: 2.3, 2.4

## Git Workflow

### Starting This Ticket
```bash
cd /home/richard/projects/vsprint
git worktree add feat-006 -b feature/VSPRINT-006-line-wrapping dev
code feat-006
```

### During Implementation
```bash
cd feat-006
git add -A && git commit -m "feat: VSPRINT-006 add line wrapping and whitespace visualization"
```

### Completing This Ticket
```bash
cd feat-006
git push -u origin feature/VSPRINT-006-line-wrapping
gh pr create --base dev --title "feat: VSPRINT-006 Line wrapping and whitespace visualization"
```

### After PR Merged
```bash
cd /home/richard/projects/vsprint
git worktree remove feat-006
cd dev && git pull origin dev
```

### Parallel Execution with VSPRINT-007
This ticket can run in parallel with VSPRINT-007 (Code Intelligence):

```bash
# Create both worktrees after VSPRINT-005 is merged:
cd /home/richard/projects/vsprint
git worktree add feat-006 -b feature/VSPRINT-006-line-wrapping dev
git worktree add feat-007 -b feature/VSPRINT-007-code-intelligence dev

# Open in separate windows:
code feat-006  # Work on line wrapping
code feat-007  # Work on code intelligence (parallel)
```

### Merge Order
Either ticket can merge first. After one merges:
1. `cd [other-worktree] && git pull origin dev`
2. Resolve any conflicts (unlikely - different code areas)
3. Continue with PR for remaining ticket

## Objective

Implement configurable line wrapping options (none, soft, hard) and whitespace visualization (none, boundary, all) for printed code. This enhances readability for long lines and makes indentation/spacing explicit when debugging formatting issues.

## Context

After VSPRINT-005 integrates Shiki highlighting, code is rendered with syntax colors but retains the basic layout from Phase 1. Long lines either get cut off at page margins or force horizontal scrolling in print preview. Additionally, subtle whitespace issues (tabs vs spaces, trailing whitespace) are invisible in printed output.

This ticket adds two independent enhancements to the HTML renderer:

1. **Line Wrapping**: Control how long lines are handled
   - `none`: Lines extend beyond page width (current behavior)
   - `soft`: Wrap at word boundaries with continuation indicators
   - `hard`: Wrap at character boundaries (preserves exact columns)

2. **Whitespace Visualization**: Make invisible characters visible
   - `none`: Normal rendering (current behavior)
   - `boundary`: Show spaces at word boundaries only
   - `all`: Show all spaces and tabs with subtle markers

These features operate on the highlighted HTML from Shiki. They modify the CSS and post-process the HTML to add markers/indicators.

Integration points:
- **Modify**: `src/renderers/htmlRenderer.ts` lines 28-118 (CSS generation)
- **Modify**: `src/renderers/htmlRenderer.ts` lines 159-181 (code table generation)
- **Modify**: `src/config/settings.ts` lines 6-10, 15-19, 27-35 (add new settings)
- **Modify**: `package.json` lines 43-64 (add configuration options)

## Implementation Approach

**Line Wrapping:**
Use CSS `white-space` and `word-wrap` properties:
- `none`: `white-space: pre; overflow-x: auto;`
- `soft`: `white-space: pre-wrap; word-wrap: break-word;` + visual indicators
- `hard`: `white-space: pre-wrap; word-break: break-all;`

Add line continuation indicators using CSS pseudo-elements (`::after`) on wrapped lines. Detect wrapping via line height calculation or explicit markers.

**Whitespace Visualization:**
Post-process highlighted HTML to replace spaces/tabs with marked versions:
- Spaces: Replace with `<span class="ws-space">·</span>` (middle dot)
- Tabs: Replace with `<span class="ws-tab">→</span>` (right arrow)
- Style markers with `color: #ccc; font-weight: normal;`

Apply transformations after Shiki highlighting but before table insertion.

**Architecture Decision:**
Create a new utility module `src/utils/textTransform.ts` for whitespace marking. Keep HTML renderer focused on layout/structure.

## Technical Requirements

**Constraints:**
- MUST preserve syntax highlighting from Shiki (wrap/mark after highlighting)
- MUST NOT break line number alignment in table layout
- MUST handle continuation indicators for soft wrapping
- MUST make whitespace markers subtle (light gray, not distracting)
- MUST support all three line wrap modes (none, soft, hard)
- MUST support all three whitespace modes (none, boundary, all)
- SHOULD preserve indentation on wrapped lines
- SHOULD distinguish tabs from multiple spaces in visualization
- MAY add setting for continuation indicator character

### Source File References

```
File: /home/richard/projects/vsprint/dev/src/renderers/htmlRenderer.ts
Lines: 28-118 - generateStyles function
  Add CSS for line wrapping modes (white-space, word-wrap properties).
  Add CSS for whitespace markers (.ws-space, .ws-tab classes).
  Add CSS for line continuation indicators.

Lines: 159-181 - generateCodeTable function
  Post-process highlighted HTML to add whitespace markers.
  Apply line wrap CSS class to code cells.

Lines: 82-87 - .code-line pre styles
  Current: white-space: pre-wrap (hardcoded).
  Change to: dynamic based on settings.lineWrap.
```

```
File: /home/richard/projects/vsprint/dev/src/config/settings.ts
Lines: 6-10 - PrintSettings interface
  Add `lineWrap: 'none' | 'soft' | 'hard'`
  Add `showWhitespace: 'none' | 'boundary' | 'all'`

Lines: 15-19 - DEFAULT_SETTINGS
  Add `lineWrap: 'soft'` as default
  Add `showWhitespace: 'none'` as default

Lines: 27-35 - getSettings function
  Add lineWrap retrieval with fallback
  Add showWhitespace retrieval with fallback
```

```
File: /home/richard/projects/vsprint/dev/package.json
Lines: 43-64 - configuration.properties
  Add vsprint.lineWrap with enum: ["none", "soft", "hard"]
  Add vsprint.showWhitespace with enum: ["none", "boundary", "all"]
```

### Files to Create/Modify

```
src/
├── utils/
│   └── textTransform.ts         # CREATE - ~120 lines
│       - visualizeWhitespace(html: string, mode: string): string
│       - replaceSpaces(text: string): string
│       - replaceTabs(text: string): string
│       - Helper: detectBoundaries(text: string)
│
├── renderers/
│   └── htmlRenderer.ts          # MODIFY lines 28-118, 82-87, 159-181
│       - Add lineWrap CSS classes
│       - Add whitespace marker CSS
│       - Import and use visualizeWhitespace
│       - Apply dynamic white-space CSS
│
├── config/
│   └── settings.ts              # MODIFY lines 6-10, 15-19, 27-35
│       - Add lineWrap property
│       - Add showWhitespace property
│       - Add getters for both settings
│
package.json                     # MODIFY lines 43-64
  - Add vsprint.lineWrap configuration
  - Add vsprint.showWhitespace configuration
```

## Acceptance Criteria

#### AC1: Line Wrap - None Mode
- **Given** a file with lines longer than 80 characters
- **When** user sets `vsprint.lineWrap` to "none" and prints
- **Then** long lines extend beyond page width
- **And** horizontal scrolling is available in print preview

#### AC2: Line Wrap - Soft Mode
- **Given** a file with lines longer than page width
- **When** user sets `vsprint.lineWrap` to "soft" and prints
- **Then** lines wrap at word boundaries
- **And** continuation indicators appear on wrapped segments
- **And** indentation is preserved on wrapped lines

#### AC3: Line Wrap - Hard Mode
- **Given** a file with very long single-word identifiers
- **When** user sets `vsprint.lineWrap` to "hard" and prints
- **Then** lines wrap at character boundaries to fit page width
- **And** no horizontal overflow occurs

#### AC4: Whitespace Visualization - None Mode
- **Given** any file with spaces and tabs
- **When** user sets `vsprint.showWhitespace` to "none" and prints
- **Then** spaces and tabs are invisible (normal rendering)

#### AC5: Whitespace Visualization - All Mode
- **Given** a Python file with mixed spaces and tabs
- **When** user sets `vsprint.showWhitespace` to "all" and prints
- **Then** all spaces show as middle dots (·)
- **And** all tabs show as right arrows (→)
- **And** markers are light gray and subtle

#### AC6: Whitespace Visualization - Boundary Mode
- **Given** a file with multiple spaces between words
- **When** user sets `vsprint.showWhitespace` to "boundary" and prints
- **Then** only spaces at word boundaries are marked
- **And** spaces within words remain invisible

#### AC7: Combined Features
- **Given** settings: `lineWrap: "soft"`, `showWhitespace: "all"`
- **When** printing a file with long lines and tabs
- **Then** lines wrap at word boundaries with indicators
- **And** whitespace markers are visible on both original and wrapped lines
- **And** syntax highlighting is preserved

## Testing Requirements

### Test Commands
```bash
cd feat-006
npm test -- --grep "lineWrap"
npm test -- --grep "whitespace"
npm test -- --grep "textTransform"
```

### Test Files to Create
```
test/
├── utils/
│   └── textTransform.test.ts    # CREATE - ~100 lines
│       - Test visualizeWhitespace with mode='all'
│       - Test visualizeWhitespace with mode='boundary'
│       - Test visualizeWhitespace with mode='none'
│       - Test tab replacement with → character
│       - Test space replacement with · character
│       - Test preservation of highlighted HTML tags
│
└── renderers/
    └── htmlRenderer.test.ts     # MODIFY - add ~50 lines
        - Test CSS generation for lineWrap modes
        - Test whitespace marker CSS inclusion
        - Test integrated wrapping + whitespace output
```

### Coverage
- Minimum: 80%
- Critical paths: 90%
- Focus areas:
  - Whitespace visualization logic (all modes)
  - CSS generation for wrap modes
  - Integration with Shiki-highlighted HTML
  - Preservation of syntax highlighting

### Manual Testing Checklist
- [ ] Print file with long lines, `lineWrap: "none"` → scrollbar appears
- [ ] Print file with long lines, `lineWrap: "soft"` → wraps at words
- [ ] Print file with long lines, `lineWrap: "hard"` → wraps at chars
- [ ] Print Python file with tabs, `showWhitespace: "all"` → arrows visible
- [ ] Print JavaScript with spaces, `showWhitespace: "all"` → dots visible
- [ ] Verify whitespace markers are subtle (light gray)
- [ ] Verify syntax colors preserved after whitespace marking
- [ ] Test combined: soft wrap + show all whitespace

## AI Implementation Prompt

> **You are implementing line wrapping and whitespace visualization for VSPrint, a VS Code extension for professional code printing.**
>
> **Your Task**:
> 1. Create `src/utils/textTransform.ts` with:
>    - `visualizeWhitespace(html: string, mode: 'none' | 'boundary' | 'all'): string`
>    - Replace spaces with `<span class="ws-space">·</span>`
>    - Replace tabs with `<span class="ws-tab">→</span>`
>    - Handle `mode='boundary'` by detecting word boundaries (regex: `\s+(?=\S)`)
>    - Preserve HTML tags from Shiki (don't replace spaces inside `<span style="...">`)
> 2. Modify `src/config/settings.ts`:
>    - Add `lineWrap: 'none' | 'soft' | 'hard'` to `PrintSettings` interface (line 6)
>    - Add `showWhitespace: 'none' | 'boundary' | 'all'` to `PrintSettings` interface (line 7)
>    - Add defaults: `lineWrap: 'soft'`, `showWhitespace: 'none'` (lines 15-19)
>    - Add getters in `getSettings()` (lines 27-35)
> 3. Modify `package.json`:
>    - Add `vsprint.lineWrap` with enum: ["none", "soft", "hard"], default: "soft"
>    - Add `vsprint.showWhitespace` with enum: ["none", "boundary", "all"], default: "none"
> 4. Modify `src/renderers/htmlRenderer.ts`:
>    - Import `visualizeWhitespace` from `../utils/textTransform`
>    - In `generateStyles()` (lines 28-118):
>      - Add CSS for `.ws-space` and `.ws-tab`: `color: #ccc; font-weight: normal;`
>      - Modify `.code-line pre` white-space based on settings.lineWrap:
>        - none: `white-space: pre; overflow-x: auto;`
>        - soft: `white-space: pre-wrap; word-wrap: break-word;`
>        - hard: `white-space: pre-wrap; word-break: break-all;`
>    - In `generateCodeTable()` (lines 159-181):
>      - After syntax highlighting, call `visualizeWhitespace(escapedLine, settings.showWhitespace)`
>      - Apply result to table cell
>
> **Worktree**: You are working in `feat-006/` worktree
>
> **Architecture Guidelines**:
> - Follow functional patterns in `htmlRenderer.ts`
> - Use regex carefully to preserve Shiki's `<span>` tags when marking whitespace
> - Keep whitespace markers subtle (not bold, light color)
> - Test with Shiki-highlighted HTML (don't break tags)
>
> **Success Criteria**:
> - `npm test -- --grep "whitespace"` passes
> - Long lines wrap according to selected mode
> - Whitespace markers appear in "all" mode
> - Syntax highlighting is preserved
> - Print preview shows correct wrapping behavior

## Completion Checklist

- [ ] `src/utils/textTransform.ts` created
- [ ] `src/config/settings.ts` updated with lineWrap and showWhitespace
- [ ] `package.json` updated with new configurations
- [ ] `src/renderers/htmlRenderer.ts` integrated with text transforms
- [ ] CSS for line wrapping modes added
- [ ] CSS for whitespace markers added
- [ ] Tests written and passing (minimum 6 tests)
- [ ] Manual testing complete (all wrap modes, all whitespace modes)
- [ ] Combined feature testing (wrap + whitespace)
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
