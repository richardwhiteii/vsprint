# Change Log

All notable changes to the "vsprint" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-14

### Added

#### Core Features
- Professional code printing with advanced syntax highlighting
- Print current file with customizable formatting options
- Print selected code regions
- Git diff printing with unified and side-by-side modes
- Git blame annotations with author and date information
- Print preview panel with live updates
- Jupyter notebook printing with cell outputs
- Rendered Markdown printing with embedded images

#### Export Features
- Export to HTML with embedded styles
- Export to PDF with customizable page layout
- PDF configuration: margins, orientation, paper size
- Custom paper size support

#### Customization
- Multiple syntax highlighting themes (light, dark, GitHub, Monokai)
- Built-in print themes: default, code review, minimal, documentation, grayscale
- Custom CSS support for advanced styling
- Color schemes: light, dark, high contrast, grayscale
- Configurable font family and size (6-20pt)
- Line numbering with customizable display
- Line wrapping modes: none, soft, hard
- Whitespace visualization: none, boundary, all

#### Layout & Formatting
- Headers and footers with template placeholders
- Multi-column layouts (1, 2, or 4 columns)
- Function and class separators
- Folded region handling: expand, collapse, as-is
- Watermarks with configurable opacity and position
- Company branding with logo and name
- QR code generation linking to repository

#### Advanced Features
- Print profiles: save, load, and delete custom configurations
- Settings sync compatibility across devices
- Large file handling with performance optimizations
- Streaming rendering for files with 5000+ lines
- LRU cache for improved performance
- Progress indicators for long operations
- Cancellation support for print operations

#### Accessibility
- High contrast mode (WCAG AA compliant)
- Large print mode with 16pt minimum font
- Accessible color schemes

#### Developer Features
- Public extension API for other extensions
- TypeScript declarations for API consumers
- `print(options)` - Print files or content programmatically
- `getPreview(options)` - Generate print preview HTML

#### User Interface
- Context menu entries in editor and explorer
- Keyboard shortcuts (Ctrl+Alt+P for print)
- Activity bar preview panel
- Interactive preview with zoom controls
- File filtering with glob patterns
- .gitignore respect for folder printing

### Context Menus
- Editor context menu: Print File, Print Selection, Export HTML, Export PDF
- Editor title context menu: Print File, Export PDF
- Explorer context menu: Print File, Export PDF (files only)

### Keyboard Shortcuts
- `Ctrl+Alt+P` (Mac: `Cmd+Alt+P`): Print current file
- `Ctrl+Alt+Shift+P` (Mac: `Cmd+Alt+Shift+P`): Print selection
- `Ctrl+Alt+V` (Mac: `Cmd+Alt+V`): Show print preview

### Settings
Over 40 configurable settings including:
- Font and typography settings
- Theme and color customization
- PDF export configuration
- Header and footer templates
- Watermark and branding options
- Performance tuning options
- Git integration settings
- Notebook and Markdown options
- Accessibility features

## [Unreleased]

### Planned Features
- Multi-file batch printing
- Print folder/workspace with file tree
- Print to physical printer (native dialog)
- Custom templates for different file types
- Code annotation tools
- Line highlighting for emphasis
- Bookmark integration
- Print history and recent documents

---

## Version History

- **0.1.0** - Initial release with comprehensive printing features
