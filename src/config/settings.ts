import * as vscode from 'vscode';

/**
 * Print settings configuration
 */
export interface PrintSettings {
  fontSize: number;
  fontFamily: string;
  showLineNumbers: boolean;
  theme: string;
  foldedRegions: 'expand' | 'collapse' | 'asIs';
  showSeparators: boolean;
}

/**
 * Default print settings
 */
const DEFAULT_SETTINGS: PrintSettings = {
  fontSize: 10,
  fontFamily: "Consolas, Monaco, 'Courier New', monospace",
  showLineNumbers: true,
  theme: 'github-light',
  foldedRegions: 'expand',
  showSeparators: false
};

/**
 * Get print settings from VS Code workspace configuration
 * Falls back to defaults if settings are not configured
 *
 * @returns PrintSettings object with user preferences or defaults
 */
export function getSettings(): PrintSettings {
  const config = vscode.workspace.getConfiguration('vsprint');

  return {
    fontSize: config.get<number>('fontSize', DEFAULT_SETTINGS.fontSize),
    fontFamily: config.get<string>('fontFamily', DEFAULT_SETTINGS.fontFamily),
    showLineNumbers: config.get<boolean>('showLineNumbers', DEFAULT_SETTINGS.showLineNumbers),
    theme: config.get<string>('theme', DEFAULT_SETTINGS.theme),
    foldedRegions: config.get<'expand' | 'collapse' | 'asIs'>('foldedRegions', DEFAULT_SETTINGS.foldedRegions),
    showSeparators: config.get<boolean>('showSeparators', DEFAULT_SETTINGS.showSeparators)
  };
}
