# VSPrint - Professional Code Printing for VS Code

**VSPrint** is a comprehensive code printing extension for Visual Studio Code that provides professional-quality output with advanced formatting, syntax highlighting, and extensive customization options.

## Features

### Core Printing Capabilities

- **Print Current File** - Print the active file with syntax highlighting and customizable formatting
- **Print Selection** - Print only the selected code region
- **Print Git Diff** - View and print git changes with unified or side-by-side comparison
- **Print with Git Blame** - Include author and commit information alongside your code
- **Print Preview** - Live preview with zoom controls in the activity bar
- **Jupyter Notebooks** - Print notebooks with cell outputs and execution numbers
- **Rendered Markdown** - Print markdown with embedded images and formatting

### Export Options

- **Export to HTML** - Generate standalone HTML files with embedded styles
- **Export to PDF** - Create PDFs with professional formatting and customizable layouts
- **Configurable PDF Settings** - Control margins, orientation, paper size, and more

### Customization

#### Appearance
- **Syntax Highlighting Themes** - Choose from light, dark, GitHub, Monokai, and more
- **Built-in Print Themes** - Optimized presets for different use cases:
  - `default` - Standard professional layout
  - `codeReview` - Wide margins for annotations
  - `minimal` - Compact layout to save paper
  - `documentation` - Optimized for readability
  - `grayscale` - Black & white for monochrome printers
- **Custom CSS** - Complete control with your own stylesheets
- **Color Schemes** - light, dark, highContrast, or grayscale

#### Typography
- **Font Family** - Choose your preferred monospace font
- **Font Size** - Adjustable from 6pt to 20pt
- **Line Numbers** - Toggle display of line numbers
- **Line Wrapping** - none, soft (word boundaries), or hard (character boundaries)

#### Layout
- **Headers & Footers** - Customizable templates with placeholders for filename, date, page numbers, etc.
- **Multi-Column Layouts** - Print in 1, 2, or 4 columns
- **Function Separators** - Visual boundaries between functions and classes
- **Folded Regions** - Control how folded code appears: expand, collapse, or as-is

#### Branding & Watermarks
- **Company Branding** - Add your logo and company name to printouts
- **Watermarks** - Overlay text like "DRAFT" or "CONFIDENTIAL" with adjustable opacity
- **QR Codes** - Generate QR codes linking to the file in your repository

### Advanced Features

- **Print Profiles** - Save and load custom print configurations
- **Settings Sync** - Your settings sync across devices via VS Code Settings Sync
- **Performance Optimizations** - Efficient handling of large files (5000+ lines) with streaming
- **File Filtering** - Exclude files using glob patterns and .gitignore
- **Accessibility** - High contrast mode and large print mode (WCAG AA compliant)

### Developer API

VSPrint provides a public API for other extensions to integrate printing capabilities:

```typescript
// Get the VSPrint API
const vsprintExt = vscode.extensions.getExtension('richardwhiteii.vsprint');
const vsprintApi = await vsprintExt?.activate();

// Print active file
await vsprintApi.print();

// Print specific file
await vsprintApi.print({
  uri: vscode.Uri.file('/path/to/file.ts')
});

// Print custom content
await vsprintApi.print({
  content: 'console.log("Hello");',
  languageId: 'javascript',
  fileName: 'example.js'
});

// Get HTML preview without printing
const html = await vsprintApi.print({ showDialog: false });

// Generate preview
const preview = await vsprintApi.getPreview();
console.log(`HTML: ${preview.html.length} bytes`);
console.log(`Estimated pages: ${preview.pageCount}`);
```

## Getting Started

### Installation

1. Open VS Code
2. Press `Ctrl+P` (Mac: `Cmd+P`) to open Quick Open
3. Type `ext install richardwhiteii.vsprint`
4. Press Enter

### Quick Start

1. Open any code file
2. Press `Ctrl+Alt+P` (Mac: `Cmd+Alt+P`) or right-click and select **VSPrint: Print Current File**
3. Your browser will open with a print-ready preview
4. Use your browser's print dialog to print or save as PDF

## Keyboard Shortcuts

| Command | Windows/Linux | Mac |
|---------|---------------|-----|
| Print Current File | `Ctrl+Alt+P` | `Cmd+Alt+P` |
| Print Selection | `Ctrl+Alt+Shift+P` | `Cmd+Alt+Shift+P` |
| Show Print Preview | `Ctrl+Alt+V` | `Cmd+Alt+V` |

## Commands

Access these commands via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- `VSPrint: Print Current File` - Print the active file
- `VSPrint: Print Selection` - Print selected code
- `VSPrint: Print Git Diff` - Print git changes
- `VSPrint: Print with Git Blame` - Print with author annotations
- `VSPrint: Export to HTML` - Save as HTML file
- `VSPrint: Export to PDF` - Save as PDF file
- `VSPrint: Show Print Preview` - Open preview panel
- `VSPrint: Print Jupyter Notebook` - Print notebook with outputs
- `VSPrint: Print Rendered Markdown` - Print markdown as HTML
- `VSPrint: Save Print Profile` - Save current settings as profile
- `VSPrint: Load Print Profile` - Load saved profile
- `VSPrint: Delete Print Profile` - Remove saved profile

## Settings

VSPrint provides extensive customization through VS Code settings. Access settings via `File > Preferences > Settings` and search for "vsprint".

### Common Settings

```json
{
  // Font and Typography
  "vsprint.fontSize": 10,
  "vsprint.fontFamily": "Consolas, Monaco, 'Courier New', monospace",
  "vsprint.showLineNumbers": true,

  // Theme and Appearance
  "vsprint.theme": "github-light",
  "vsprint.builtinTheme": "default",
  "vsprint.colorScheme": "light",

  // Layout
  "vsprint.lineWrap": "soft",
  "vsprint.columns": 1,
  "vsprint.showSeparators": false,

  // Headers and Footers
  "vsprint.header.template": "{filename}",
  "vsprint.footer.template": "Page {page} of {pages}",

  // PDF Settings
  "vsprint.pdf.paperSize": "A4",
  "vsprint.pdf.orientation": "portrait",
  "vsprint.pdf.margins": {
    "top": 10,
    "bottom": 10,
    "left": 10,
    "right": 10
  },

  // Watermark
  "vsprint.watermark.text": "",
  "vsprint.watermark.opacity": 0.15,
  "vsprint.watermark.position": "diagonal",

  // Performance
  "vsprint.performance.maxLines": 5000,
  "vsprint.performance.cacheEnabled": true
}
```

### Header/Footer Placeholders

Use these placeholders in `vsprint.header.template` and `vsprint.footer.template`:

- `{filename}` - File name
- `{filepath}` - Full file path
- `{date}` - Current date
- `{time}` - Current time
- `{page}` - Current page number
- `{pages}` - Total page count

### Available Themes

**Syntax Highlighting**: `light`, `dark`, `github-light`, `github-dark`, `monokai`

**Built-in Print Themes**:
- `default` - Standard layout with balanced margins
- `codeReview` - Wide margins for handwritten notes
- `minimal` - Compact layout to reduce pages
- `documentation` - Optimized for readable documentation
- `grayscale` - Black & white for monochrome printers

## Context Menus

Right-click in various locations to access VSPrint commands:

### Editor Context Menu
- Print File
- Print Selection
- Export to HTML
- Export to PDF

### Editor Tab Context Menu
- Print File
- Export to PDF

### Explorer Context Menu
- Print File (single file)
- Export to PDF (single file)

## Use Cases

### Code Reviews
Use the `codeReview` theme with wide margins for annotations:
```json
{
  "vsprint.builtinTheme": "codeReview",
  "vsprint.showLineNumbers": true,
  "vsprint.watermark.text": "FOR REVIEW"
}
```

### Documentation
Print code examples for technical documentation:
```json
{
  "vsprint.builtinTheme": "documentation",
  "vsprint.showSeparators": true,
  "vsprint.theme": "github-light"
}
```

### Archival
Create permanent records with branding:
```json
{
  "vsprint.branding.logo": "/path/to/logo.png",
  "vsprint.branding.companyName": "Your Company",
  "vsprint.qrcode.enabled": true
}
```

## Requirements

- Visual Studio Code 1.85.0 or higher
- Modern web browser for print preview (Chrome, Firefox, Edge, Safari)

## Known Issues

- Very large files (50,000+ lines) may take several seconds to render
- Custom CSS paths must be absolute or relative to workspace root
- QR code generation requires an active git repository with remote URL

## Contributing

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/richardwhiteii/vsprint/issues).

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Enjoy professional code printing with VSPrint!**
