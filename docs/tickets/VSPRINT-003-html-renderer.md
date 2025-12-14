# VSPRINT-003: Renderer - Implement HTML Renderer with Line Numbers

## Status
- **Status**: [ ] Not Started
- **Assignee**: —
- **Branch**: `feature/VSPRINT-003-html-renderer`
- **Worktree**: `feat-003/`
- **PR**: —

## Ticket Info
| Field | Value |
|-------|-------|
| **Points** | 2pt |
| **Phase** | Phase 1: MVP Core Printing |
| **Dependencies** | VSPRINT-002 |
| **Parallel With** | — |
| **Priority** | High |

## Source Reference
- **Punchlist**: `PUNCHLIST_001.md`
- **Phase**: Phase 1 - MVP Core Printing
- **Tasks**: 1.4 Basic HTML Renderer, 1.6 Configuration Foundation

## Git Workflow

### Starting This Ticket
```bash
cd /home/richard/projects/vsprint
git worktree add feat-003 -b feature/VSPRINT-003-html-renderer dev
code feat-003
```

### During Implementation
```bash
cd feat-003
git add -A && git commit -m "feat: VSPRINT-003 HTML renderer with line numbers"
```

### Completing This Ticket
```bash
cd feat-003
git push -u origin feature/VSPRINT-003-html-renderer
gh pr create --base dev --title "feat: VSPRINT-003 HTML renderer with line numbers"
```

### After PR Merged
```bash
cd /home/richard/projects/vsprint
git worktree remove feat-003
cd dev && git pull origin dev
```

## Objective

Create an HTML renderer that converts code content into print-ready HTML with line numbers, monospace font, header/footer, and basic print-optimized CSS. Implement a configuration system to access user settings for font size, font family, and line number display. This provides the foundation for all future rendering enhancements.

## Context

This ticket builds on VSPRINT-002's file metadata extraction and creates the visual output layer. The HTML renderer is the core of VSPrint's output system - all future enhancements (syntax highlighting, PDF export, preview) will build upon this foundation.

The renderer must produce clean, semantic HTML that prints correctly across different browsers and platforms. Critical considerations:
- Line numbers must align perfectly with code lines (PUNCHLIST_001.md line 177)
- Font must be monospace for code readability
- Print CSS must optimize for paper media (hide UI elements, proper margins)
- Layout must use table structure for line number alignment (line 178)

The configuration system establishes patterns for all future settings, so it must be extensible and type-safe.

## Implementation Approach

1. **HTML Renderer Module**: Create `src/renderers/htmlRenderer.ts` with main rendering function (PUNCHLIST_001.md lines 103-108)
2. **Table-Based Layout**: Use `<table>` for line numbers + code to ensure alignment (line 178)
3. **Header/Footer**: Include filename in header, page number placeholder in footer (line 106)
4. **Print CSS**: Media queries for print optimization, monospace fonts (line 107)
5. **Settings Module**: Create `src/config/settings.ts` for VS Code settings access (lines 116-120)
6. **Package.json Config**: Define contribution points for fontSize, showLineNumbers, fontFamily (line 118)

## Technical Requirements

**Constraints:**
- MUST use table layout for line number + code alignment (PUNCHLIST_001.md line 178)
- MUST generate valid HTML5 with proper DOCTYPE
- MUST include print media CSS (`@media print`)
- MUST use monospace font stack: Consolas, Monaco, 'Courier New', monospace (line 105)
- MUST respect user settings: fontSize, showLineNumbers, fontFamily
- SHOULD include page break hints for long files
- SHOULD escape HTML entities in code content (&lt;, &gt;, &amp;)
- MAY include CSS for syntax highlighting hooks (used in Phase 2)

### Source File References

HTML structure inspiration:
```
Print-optimized HTML patterns:
- Table layout: <table><tr><td class="line-number">1</td><td class="code">...</td></tr></table>
- Print CSS: @media print { @page { margin: 1in; } }
- Monospace fonts: font-family: Consolas, Monaco, 'Courier New', monospace
```

### Files to Create/Modify

```
src/
├── renderers/
│   └── htmlRenderer.ts      # CREATE ~150 lines - HTML generation
├── config/
│   └── settings.ts          # CREATE ~60 lines - Settings access
└── commands/
    └── printFile.ts         # MODIFY - Integrate HTML renderer

package.json                 # MODIFY - Add configuration contributions
```

### HTML Renderer Structure

**src/renderers/htmlRenderer.ts** (PUNCHLIST_001.md lines 103-108):
```typescript
import * as vscode from 'vscode';
import { FileMetadata } from '../commands/printFile';
import { getSettings } from '../config/settings';

export interface RenderOptions {
  showLineNumbers: boolean;
  fontSize: number;
  fontFamily: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderHtml(metadata: FileMetadata): string {
  const settings = getSettings();
  const lines = metadata.content.split('\n');

  const lineRows = lines.map((line, index) => {
    const lineNumber = index + 1;
    const escapedLine = escapeHtml(line);

    if (settings.showLineNumbers) {
      return `
        <tr>
          <td class="line-number">${lineNumber}</td>
          <td class="code-line"><pre>${escapedLine || ' '}</pre></td>
        </tr>`;
    } else {
      return `
        <tr>
          <td class="code-line" colspan="2"><pre>${escapedLine || ' '}</pre></td>
        </tr>`;
    }
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Print: ${escapeHtml(metadata.fileName)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${settings.fontFamily};
      font-size: ${settings.fontSize}pt;
      line-height: 1.4;
      background: white;
      color: black;
    }

    .header {
      border-bottom: 2px solid #333;
      padding: 10px 0;
      margin-bottom: 20px;
    }

    .header h1 {
      font-size: ${settings.fontSize + 2}pt;
      font-weight: bold;
    }

    .header .meta {
      font-size: ${settings.fontSize - 1}pt;
      color: #666;
      margin-top: 5px;
    }

    .code-table {
      width: 100%;
      border-collapse: collapse;
      font-family: ${settings.fontFamily};
      font-size: ${settings.fontSize}pt;
    }

    .line-number {
      width: 50px;
      text-align: right;
      padding-right: 15px;
      color: #999;
      border-right: 1px solid #ddd;
      user-select: none;
      vertical-align: top;
    }

    .code-line {
      padding-left: 15px;
      white-space: pre;
      vertical-align: top;
    }

    .code-line pre {
      margin: 0;
      font-family: inherit;
      font-size: inherit;
      white-space: pre;
      overflow-x: auto;
    }

    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: ${settings.fontSize - 2}pt;
      color: #666;
      text-align: center;
    }

    @media print {
      @page {
        margin: 1in;
        size: letter;
      }

      body {
        background: white;
      }

      .footer {
        position: fixed;
        bottom: 0;
      }

      /* Prevent page breaks inside code lines */
      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(metadata.fileName)}</h1>
    <div class="meta">
      File: ${escapeHtml(metadata.filePath)} |
      Language: ${metadata.languageId} |
      Lines: ${metadata.lineCount}
    </div>
  </div>

  <table class="code-table">
    <tbody>
      ${lineRows}
    </tbody>
  </table>

  <div class="footer">
    Page <span class="page-number"></span>
  </div>
</body>
</html>`;
}
```

### Settings Configuration

**src/config/settings.ts** (PUNCHLIST_001.md lines 116-120):
```typescript
import * as vscode from 'vscode';

export interface VSPrintSettings {
  fontSize: number;
  fontFamily: string;
  showLineNumbers: boolean;
}

const DEFAULT_SETTINGS: VSPrintSettings = {
  fontSize: 10,
  fontFamily: "Consolas, Monaco, 'Courier New', monospace",
  showLineNumbers: true
};

export function getSettings(): VSPrintSettings {
  const config = vscode.workspace.getConfiguration('vsprint');

  return {
    fontSize: config.get<number>('fontSize', DEFAULT_SETTINGS.fontSize),
    fontFamily: config.get<string>('fontFamily', DEFAULT_SETTINGS.fontFamily),
    showLineNumbers: config.get<boolean>('showLineNumbers', DEFAULT_SETTINGS.showLineNumbers)
  };
}

export function getSetting<K extends keyof VSPrintSettings>(
  key: K
): VSPrintSettings[K] {
  const settings = getSettings();
  return settings[key];
}
```

### Package.json Configuration Contributions

Add to `package.json` (PUNCHLIST_001.md lines 116-120):
```json
{
  "contributes": {
    "configuration": {
      "title": "VSPrint",
      "properties": {
        "vsprint.fontSize": {
          "type": "number",
          "default": 10,
          "minimum": 6,
          "maximum": 20,
          "description": "Font size in points for printed output"
        },
        "vsprint.fontFamily": {
          "type": "string",
          "default": "Consolas, Monaco, 'Courier New', monospace",
          "description": "Font family for printed code (monospace recommended)"
        },
        "vsprint.showLineNumbers": {
          "type": "boolean",
          "default": true,
          "description": "Show line numbers in printed output"
        }
      }
    }
  }
}
```

### Integration with Print File Command

Update `src/commands/printFile.ts`:
```typescript
import { renderHtml } from '../renderers/htmlRenderer';

export async function printFileCommand(logger: Logger): Promise<void> {
  // ... existing metadata extraction ...

  logger.info(`Rendering HTML for: ${metadata.fileName}`);
  const html = renderHtml(metadata);

  logger.info(`HTML generated: ${html.length} bytes`);

  // TODO: VSPRINT-004 will handle printing the HTML
  vscode.window.showInformationMessage(
    `HTML rendered for ${metadata.fileName} (${html.length} bytes)`
  );
}
```

## Acceptance Criteria

#### AC1: HTML Generation with Line Numbers
- **Given** a file with 50 lines of code
- **When** HTML is rendered with showLineNumbers=true
- **Then** output contains table with 50 rows, each with line number and code content

#### AC2: HTML Generation without Line Numbers
- **Given** a file with 50 lines of code
- **When** HTML is rendered with showLineNumbers=false
- **Then** output contains table with code only (no line number column)

#### AC3: Settings Respected
- **Given** user sets fontSize=12, fontFamily="Monaco"
- **When** rendering HTML
- **Then** generated CSS includes font-size: 12pt and font-family: Monaco

#### AC4: HTML Entity Escaping
- **Given** code contains `<div>`, `&nbsp;`, `"quotes"`
- **When** rendering HTML
- **Then** output contains `&lt;div&gt;`, `&amp;nbsp;`, `&quot;quotes&quot;`

#### AC5: Header and Footer Present
- **Given** any file is rendered
- **When** inspecting HTML
- **Then** header contains filename and metadata, footer contains page number placeholder

#### AC6: Print CSS Applied
- **Given** rendered HTML is opened in browser
- **When** print preview is accessed
- **Then** page margins are 1in, no background colors, proper page breaks

## Testing Requirements

### Test Commands
```bash
cd feat-003
npm run compile
npm test -- --grep "HTML Renderer"
```

### Automated Tests

Create `test/renderers/htmlRenderer.test.ts`:
```typescript
import * as assert from 'assert';
import { renderHtml } from '../../src/renderers/htmlRenderer';
import { FileMetadata } from '../../src/commands/printFile';

suite('HTML Renderer', () => {
  const mockMetadata: FileMetadata = {
    fileName: 'test.ts',
    filePath: '/path/to/test.ts',
    languageId: 'typescript',
    lineCount: 3,
    content: 'const x = 1;\nconsole.log(x);\n// Comment'
  };

  test('should generate valid HTML with DOCTYPE', () => {
    const html = renderHtml(mockMetadata);
    assert.ok(html.startsWith('<!DOCTYPE html>'));
    assert.ok(html.includes('<html lang="en">'));
  });

  test('should include line numbers when enabled', () => {
    const html = renderHtml(mockMetadata);
    assert.ok(html.includes('class="line-number"'));
    assert.ok(html.includes('>1</td>'));
    assert.ok(html.includes('>2</td>'));
  });

  test('should escape HTML entities', () => {
    const metadata = { ...mockMetadata, content: '<div>&nbsp;</div>' };
    const html = renderHtml(metadata);
    assert.ok(html.includes('&lt;div&gt;'));
    assert.ok(html.includes('&amp;nbsp;'));
  });

  test('should include file metadata in header', () => {
    const html = renderHtml(mockMetadata);
    assert.ok(html.includes('test.ts'));
    assert.ok(html.includes('/path/to/test.ts'));
    assert.ok(html.includes('typescript'));
    assert.ok(html.includes('Lines: 3'));
  });

  test('should include print media CSS', () => {
    const html = renderHtml(mockMetadata);
    assert.ok(html.includes('@media print'));
    assert.ok(html.includes('@page'));
    assert.ok(html.includes('margin: 1in'));
  });
});
```

### Manual Testing

1. Build extension and launch Extension Development Host
2. Open a TypeScript file with special characters (`<>`, `&`, etc.)
3. Run "VSPrint: Print File" command
4. Copy HTML output to a .html file
5. Open in browser and verify:
   - Line numbers align with code
   - Special characters render correctly
   - Print preview shows proper formatting
6. Change settings (fontSize=14, showLineNumbers=false) and verify changes

## AI Implementation Prompt

> **You are implementing the HTML renderer for VSPrint, converting code to print-ready HTML.**
>
> **Your Task**:
> 1. Create `src/renderers/htmlRenderer.ts` with renderHtml() function (PUNCHLIST_001.md lines 103-108)
> 2. Create `src/config/settings.ts` for VS Code settings access (lines 116-120)
> 3. Update `package.json` with configuration contributions for fontSize, fontFamily, showLineNumbers
> 4. Update `src/commands/printFile.ts` to call renderHtml()
> 5. Implement HTML entity escaping for code content
> 6. Use table layout for line number alignment (line 178)
>
> **Worktree**: You are working in `feat-003/` worktree
>
> **Architecture Guidelines**:
> - Table-based layout ensures line numbers align with code (PUNCHLIST_001.md line 177-178)
> - Monospace font stack: Consolas, Monaco, 'Courier New', monospace (line 105)
> - Settings API: https://code.visualstudio.com/api/references/vscode-api#workspace
> - Configuration contributions: https://code.visualstudio.com/api/references/contribution-points#contributes.configuration
>
> **Key Integration Points**:
> - FileMetadata from VSPRINT-002 provides: fileName, filePath, languageId, lineCount, content
> - Settings read via `vscode.workspace.getConfiguration('vsprint')`
> - HTML must be valid HTML5 with proper DOCTYPE
> - Print CSS must use `@media print` for print-specific styles
>
> **Success Criteria**:
> - Generated HTML is valid HTML5
> - Line numbers (if enabled) align perfectly with code lines
> - Settings (fontSize, fontFamily, showLineNumbers) are respected
> - HTML entities are properly escaped
> - Header includes filename and file metadata
> - Print CSS optimizes for paper media (1in margins, page breaks)
> - Tests pass: 6 tests for HTML rendering and settings

## Completion Checklist

- [ ] `src/renderers/htmlRenderer.ts` created with renderHtml()
- [ ] `src/config/settings.ts` created with getSettings()
- [ ] `package.json` updated with configuration contributions
- [ ] `src/commands/printFile.ts` updated to use renderHtml()
- [ ] HTML entity escaping implemented
- [ ] Table layout for line numbers implemented
- [ ] Print CSS with @media print included
- [ ] Tests written and passing (6+ tests)
- [ ] Manual testing: HTML renders correctly in browser
- [ ] Manual testing: Print preview shows proper formatting
- [ ] Manual testing: Settings changes are reflected in output
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
