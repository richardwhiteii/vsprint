# VSPRINT-008: Enhanced Formatting - Import Section Grouping

## Status
- **Status**: [ ] Not Started
- **Assignee**: —
- **Branch**: `feature/VSPRINT-008-import-grouping`
- **Worktree**: `feat-008/`
- **PR**: —

## Ticket Info
| Field | Value |
|-------|-------|
| **Points** | 1pt |
| **Phase** | Phase 2: Enhanced Formatting |
| **Dependencies** | VSPRINT-007 |
| **Parallel With** | — |
| **Priority** | Low |

## Source Reference
- **Punchlist**: `PUNCHLIST_001.md`
- **Phase**: Phase 2 - Enhanced Formatting
- **Task**: 2.7

## Git Workflow

### Starting This Ticket
```bash
cd /home/richard/projects/vsprint
git worktree add feat-008 -b feature/VSPRINT-008-import-grouping dev
code feat-008
```

### During Implementation
```bash
cd feat-008
git add -A && git commit -m "feat: VSPRINT-008 add import section visual grouping"
```

### Completing This Ticket
```bash
cd feat-008
git push -u origin feature/VSPRINT-008-import-grouping
gh pr create --base dev --title "feat: VSPRINT-008 Import section grouping"
```

### After PR Merged
```bash
cd /home/richard/projects/vsprint
git worktree remove feat-008
cd dev && git pull origin dev
```

## Objective

Add automatic visual separation between import/require sections and the main code body. This enhances readability by clearly delineating boilerplate imports from business logic, similar to how IDEs visually collapse import sections.

## Context

After VSPRINT-007 adds symbol-based separators between functions and classes, there's still no visual boundary between the import section and the first functional code. In large files with many imports, this can make printed output feel cluttered.

This ticket extends the separator system from VSPRINT-007 to detect language-specific import patterns and insert a separator line after the last import statement. This is simpler than symbol-based separation because it uses regex pattern matching rather than LSP queries.

The implementation leverages the existing separator CSS and HTML structure from VSPRINT-007. It adds a new detection function to identify the end of the import block for each supported language.

Supported languages:
- **JavaScript/TypeScript**: `import ... from`, `require(...)`
- **Python**: `import ...`, `from ... import`
- **Java**: `import ...;`
- **Go**: `import (...)` or `import "`
- **Rust**: `use ...;`
- **C/C++**: `#include ...`

Integration points:
- **Modify**: `src/services/codeIntelligence.ts` lines 1-200 (add import detection)
- **Modify**: `src/renderers/htmlRenderer.ts` lines 159-181 (insert import separator)
- **No new settings**: Imports are always separated (not configurable to keep scope small)

## Implementation Approach

**Import Detection Strategy:**
Use language-specific regex patterns to find import statements:

```typescript
const importPatterns: Record<string, RegExp> = {
  'typescript': /^import\s+.*from\s+['"]|^import\s+['"]|^const\s+.*=\s+require\(/,
  'javascript': /^import\s+.*from\s+['"]|^import\s+['"]|^const\s+.*=\s+require\(/,
  'python': /^import\s+|^from\s+.*import/,
  'java': /^import\s+.*;/,
  'go': /^import\s+\(|^import\s+"/,
  'rust': /^use\s+.*;/,
  'cpp': /^#include\s+[<"]/,
  'c': /^#include\s+[<"]/
};
```

**Algorithm:**
1. Scan file line-by-line from top
2. Track last line matching import pattern
3. Skip blank lines and comments immediately after imports
4. Return line number of last import + 1 as separator position
5. If no imports found, return -1 (no separator)

**Integration with VSPRINT-007:**
The `CodeIntelligenceService` already returns symbol boundaries. Extend it with:
- `getImportSectionEnd(content: string, languageId: string): number`
- Merge this line number with symbol boundaries before passing to HTML renderer
- Renderer doesn't need to distinguish import separators from symbol separators

**Edge Cases:**
- Empty files → no separator
- Files with only imports → no separator (no code after imports)
- Inline imports (inside functions) → ignore, only detect top-level imports
- Multi-line imports (spanning lines) → detect start, continue until pattern ends

## Technical Requirements

**Constraints:**
- MUST support TypeScript, JavaScript, Python, Java, Go, Rust, C/C++
- MUST only detect top-level imports (not imports inside functions/classes)
- MUST handle multi-line imports correctly (e.g., `import { a, b, c }` spanning 3 lines)
- MUST skip blank lines and comments between last import and code
- MUST NOT insert separator if file has no imports
- MUST NOT insert separator if file has only imports (no code after)
- SHOULD use existing separator CSS from VSPRINT-007
- MAY add language-specific patterns in future iterations

### Source File References

```
File: /home/richard/projects/vsprint/dev/src/services/codeIntelligence.ts
Lines: 1-200 - CodeIntelligenceService class
  Add method: getImportSectionEnd(content: string, languageId: string): number
  Add private helper: detectImportPattern(line: string, languageId: string): boolean
  Add constant: IMPORT_PATTERNS (regex map by language)
```

```
File: /home/richard/projects/vsprint/dev/src/commands/printFile.ts
Lines: 52-66 - Code intelligence queries
  After querying symbol boundaries, query import separator:
  const importSeparator = codeIntelligence.getImportSectionEnd(metadata.content, metadata.languageId);
  Merge with symbolBoundaries: [...symbolBoundaries, importSeparator].filter(n => n > 0).sort()
```

```
File: /home/richard/projects/vsprint/dev/src/renderers/htmlRenderer.ts
Lines: 159-181 - generateCodeTable function
  No changes needed - already accepts symbolBoundaries array
  Import separator is just another boundary in the array
```

### Files to Create/Modify

```
src/
├── services/
│   └── codeIntelligence.ts      # MODIFY - add ~80 lines
│       - Add getImportSectionEnd(content, languageId): number
│       - Add IMPORT_PATTERNS constant (regex map)
│       - Add detectImportPattern(line, languageId): boolean
│       - Add skipBlankLinesAndComments(lines, startIndex): number
│
├── commands/
│   └── printFile.ts             # MODIFY lines 52-66
│       - Query import section end
│       - Merge with symbol boundaries
│       - Pass combined array to renderer
│
└── renderers/
    └── htmlRenderer.ts          # NO CHANGES
        - Already handles separator arrays from VSPRINT-007
```

## Acceptance Criteria

#### AC1: TypeScript Import Detection
- **Given** a TypeScript file with 5 import statements followed by a class
- **When** user prints the file
- **Then** a separator line appears after the last import statement
- **And** separator line is before the class definition

#### AC2: Python Import Detection
- **Given** a Python file with `import os`, `from sys import argv`, then a function
- **When** user prints the file
- **Then** separator appears after `from sys import argv`
- **And** separator is before the function definition

#### AC3: JavaScript Require Detection
- **Given** a JavaScript file with `const fs = require('fs')` and `const path = require('path')`
- **When** user prints the file
- **Then** separator appears after the last `require()` statement

#### AC4: Multi-line Import Handling
- **Given** a TypeScript file with multi-line import spanning lines 1-5
  ```typescript
  import {
    Component,
    OnInit,
    Input
  } from '@angular/core';
  ```
- **When** user prints the file
- **Then** separator appears after line 5 (end of import block)
- **And** separator is not duplicated for each line

#### AC5: No Imports - No Separator
- **Given** a file with no import statements
- **When** user prints the file
- **Then** no import separator appears
- **And** file renders normally

#### AC6: Imports Only - No Separator
- **Given** a file containing only import statements (no code after)
- **When** user prints the file
- **Then** no separator appears (nothing to separate from)

#### AC7: Combined with Symbol Separators
- **Given** settings: `showSeparators: true` and a file with imports + 3 functions
- **When** user prints the file
- **Then** separator appears after imports
- **And** separators appear between functions (total: 3 separators)
- **And** all separators use same visual style

#### AC8: Language Support
- **Given** files in TypeScript, Python, Java, Go, Rust, C++
- **When** printing each file with imports
- **Then** import separators appear correctly for all languages
- **And** language-specific patterns are matched accurately

## Testing Requirements

### Test Commands
```bash
cd feat-008
npm test -- --grep "import"
npm test -- --grep "codeIntelligence"
```

### Test Files to Create
```
test/
└── services/
    └── codeIntelligence.test.ts # MODIFY - add ~100 lines
        - Test getImportSectionEnd with TypeScript imports
        - Test getImportSectionEnd with JavaScript requires
        - Test getImportSectionEnd with Python imports
        - Test getImportSectionEnd with Java imports
        - Test getImportSectionEnd with Go imports
        - Test getImportSectionEnd with Rust use statements
        - Test getImportSectionEnd with C++ includes
        - Test multi-line import handling
        - Test file with no imports (returns -1)
        - Test file with only imports (returns -1)
        - Test blank lines after imports (skipped)
        - Test comments after imports (skipped)
```

### Coverage
- Minimum: 85%
- Critical paths: 95%
- Focus areas:
  - Import pattern regex matching
  - Multi-line import handling
  - Blank line/comment skipping
  - Language-specific patterns

### Manual Testing Checklist
- [ ] Print TypeScript file with imports → separator after imports
- [ ] Print Python file with imports → separator after imports
- [ ] Print JavaScript with `require()` → separator after requires
- [ ] Print Java file with imports → separator after imports
- [ ] Print Go file with imports → separator after imports
- [ ] Print file with no imports → no separator
- [ ] Print file with only imports → no separator
- [ ] Test combined with `showSeparators: true` → multiple separators
- [ ] Verify separator style matches symbol separators (same CSS)

## AI Implementation Prompt

> **You are implementing import section grouping for VSPrint, a VS Code extension for professional code printing.**
>
> **Your Task**:
> 1. Modify `src/services/codeIntelligence.ts`:
>    - Add constant `IMPORT_PATTERNS` (object mapping language IDs to regex):
>      ```typescript
>      const IMPORT_PATTERNS: Record<string, RegExp> = {
>        'typescript': /^\s*import\s+.*from\s+['"]|^\s*import\s+['"]|^\s*const\s+.*=\s*require\(/,
>        'javascript': /^\s*import\s+.*from\s+['"]|^\s*import\s+['"]|^\s*const\s+.*=\s*require\(/,
>        'python': /^\s*import\s+|^\s*from\s+.*import/,
>        'java': /^\s*import\s+.*;/,
>        'go': /^\s*import\s+\(|^\s*import\s+"/,
>        'rust': /^\s*use\s+.*;/,
>        'cpp': /^\s*#include\s+[<"]/,
>        'c': /^\s*#include\s+[<"]/
>      };
>      ```
>    - Add method `getImportSectionEnd(content: string, languageId: string): number`:
>      - Split content into lines
>      - Get pattern for languageId (return -1 if unsupported)
>      - Scan lines from top, track last line matching pattern
>      - After last import, skip blank lines and comments (`//`, `#`, `/*`)
>      - Return line number after last import + skipped lines
>      - Return -1 if no imports or imports at end of file
> 2. Modify `src/commands/printFile.ts` (lines 52-66):
>    - After querying symbol boundaries, add:
>      ```typescript
>      const importSeparator = await codeIntelligence.getImportSectionEnd(
>        metadata.content,
>        metadata.languageId
>      );
>      const allBoundaries = [...symbolBoundaries];
>      if (importSeparator > 0) {
>        allBoundaries.push(importSeparator);
>      }
>      allBoundaries.sort((a, b) => a - b);
>      ```
>    - Pass `allBoundaries` to `generatePrintHtml()`
> 3. No changes to `htmlRenderer.ts` (already handles separator arrays)
>
> **Worktree**: You are working in `feat-008/` worktree
>
> **Architecture Guidelines**:
> - Reuse separator CSS from VSPRINT-007 (no new styles needed)
> - Keep import detection simple (regex-based, no LSP)
> - Handle edge cases gracefully (no imports, imports only)
> - Test multi-line imports (spanning 3+ lines)
>
> **Success Criteria**:
> - `npm test -- --grep "import"` passes (12+ tests)
> - TypeScript/JavaScript files show separator after imports
> - Python/Java/Go/Rust/C++ files show separator after imports
> - Files with no imports render without separators
> - Multi-line imports handled correctly
> - Separator style matches symbol separators

## Completion Checklist

- [ ] `src/services/codeIntelligence.ts` updated with import detection
- [ ] `IMPORT_PATTERNS` constant added for 7+ languages
- [ ] `getImportSectionEnd()` method implemented
- [ ] `src/commands/printFile.ts` updated to merge import separator
- [ ] Tests written and passing (minimum 12 tests)
- [ ] Manual testing complete (TypeScript, Python, JavaScript, Java, Go)
- [ ] Multi-line import handling tested
- [ ] No-import and imports-only cases tested
- [ ] Combined with symbol separators tested
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
