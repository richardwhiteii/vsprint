import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Maximum allowed custom CSS file size (1MB)
 */
const MAX_CSS_SIZE = 1024 * 1024;

/**
 * Built-in theme names and their corresponding CSS file names
 */
export const BUILTIN_THEMES = {
  codeReview: 'codeReview.css',
  minimal: 'minimal.css',
  documentation: 'documentation.css',
  grayscale: 'grayscale.css',
  highContrast: 'highContrast.css'
} as const;

export type BuiltinThemeName = keyof typeof BUILTIN_THEMES;

/**
 * Color scheme options for automatic theme adjustment
 */
export type ColorScheme = 'light' | 'dark' | 'highContrast' | 'grayscale';

/**
 * Load custom CSS file from user-specified path
 *
 * @param cssPath - Absolute or relative path to CSS file
 * @returns CSS content as string
 * @throws Error if file doesn't exist, is too large, or can't be read
 */
export async function loadCustomCss(cssPath: string): Promise<string> {
  try {
    // Resolve path relative to workspace if not absolute
    let resolvedPath = cssPath;
    if (!path.isAbsolute(cssPath)) {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (workspaceFolder) {
        resolvedPath = path.join(workspaceFolder.uri.fsPath, cssPath);
      } else {
        throw new Error('Cannot resolve relative path: no workspace folder open');
      }
    }

    // Check if file exists
    const uri = vscode.Uri.file(resolvedPath);
    let stats;
    try {
      stats = await vscode.workspace.fs.stat(uri);
    } catch (error) {
      throw new Error(`Custom CSS file not found: ${resolvedPath}`);
    }

    // Check file size
    if (stats.size > MAX_CSS_SIZE) {
      vscode.window.showWarningMessage(
        `Custom CSS file is very large (${Math.round(stats.size / 1024)}KB). This may affect performance.`
      );
    }

    // Read file content
    const content = await vscode.workspace.fs.readFile(uri);
    const cssText = Buffer.from(content).toString('utf8');

    // Basic validation - check if it looks like CSS
    if (!cssText.trim()) {
      throw new Error('Custom CSS file is empty');
    }

    return cssText;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to load custom CSS: ${String(error)}`);
  }
}

/**
 * Load a built-in theme CSS file
 *
 * @param themeName - Name of the built-in theme
 * @returns CSS content as string
 * @throws Error if theme file can't be loaded
 */
export async function loadBuiltinTheme(themeName: BuiltinThemeName): Promise<string> {
  try {
    const extensionPath = vscode.extensions.getExtension('richardwhiteii.vsprint')?.extensionPath;
    if (!extensionPath) {
      throw new Error('Extension path not found');
    }

    const themePath = path.join(extensionPath, 'dist', 'themes', BUILTIN_THEMES[themeName]);

    // Try to read the file synchronously for built-in themes
    // (they should always be present in the extension package)
    if (!fs.existsSync(themePath)) {
      throw new Error(`Built-in theme file not found: ${themePath}`);
    }

    const cssText = fs.readFileSync(themePath, 'utf8');
    return cssText;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to load built-in theme: ${String(error)}`);
  }
}

/**
 * Get CSS variable overrides for color schemes
 *
 * @param colorScheme - Color scheme to apply
 * @returns CSS string with variable overrides
 */
export function getColorSchemeOverrides(colorScheme: ColorScheme): string {
  switch (colorScheme) {
    case 'light':
      return `
:root {
  --vsprint-bg-color: #ffffff;
  --vsprint-text-color: #24292e;
  --vsprint-line-number-color: #57606a;
  --vsprint-border-color: #d0d7de;
  --vsprint-header-bg: #f6f8fa;
}`;

    case 'dark':
      return `
:root {
  --vsprint-bg-color: #0d1117;
  --vsprint-text-color: #e6edf3;
  --vsprint-line-number-color: #7d8590;
  --vsprint-border-color: #30363d;
  --vsprint-header-bg: #161b22;
}`;

    case 'highContrast':
      return `
:root {
  --vsprint-bg-color: #000000;
  --vsprint-text-color: #ffffff;
  --vsprint-line-number-color: #ffff00;
  --vsprint-border-color: #ffffff;
  --vsprint-header-bg: #1a1a1a;
}

body {
  border: 2px solid #ffffff;
}

.line-number {
  border-right: 2px solid #ffffff;
  font-weight: bold;
}

.header, .footer {
  border-color: #ffffff;
}`;

    case 'grayscale':
      return `
:root {
  --vsprint-bg-color: #ffffff;
  --vsprint-text-color: #000000;
  --vsprint-line-number-color: #666666;
  --vsprint-border-color: #333333;
  --vsprint-header-bg: #f5f5f5;
}

* {
  color: #000000 !important;
}

.line-number {
  color: #666666 !important;
}`;

    default:
      return '';
  }
}

/**
 * Combine base CSS with custom/theme CSS and color scheme overrides
 *
 * @param baseStyles - Base CSS styles
 * @param additionalCss - Optional custom or theme CSS
 * @param colorScheme - Optional color scheme to apply
 * @returns Combined CSS string
 */
export function combineCssStyles(
  baseStyles: string,
  additionalCss?: string,
  colorScheme?: ColorScheme
): string {
  const parts = [baseStyles];

  if (additionalCss) {
    parts.push('\n/* Custom/Theme CSS */\n', additionalCss);
  }

  if (colorScheme) {
    parts.push('\n/* Color Scheme Overrides */\n', getColorSchemeOverrides(colorScheme));
  }

  return parts.join('\n');
}
