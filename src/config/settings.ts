import * as vscode from 'vscode';

/**
 * Print settings configuration
 */
export interface PrintSettings {
  fontSize: number;
  fontFamily: string;
  showLineNumbers: boolean;
  theme: string;
  lineWrap: 'none' | 'soft' | 'hard';
  showWhitespace: 'none' | 'boundary' | 'all';
}

/**
 * Default print settings
 */
const DEFAULT_SETTINGS: PrintSettings = {
  fontSize: 10,
  fontFamily: "Consolas, Monaco, 'Courier New', monospace",
  showLineNumbers: true,
  theme: 'github-light',
  lineWrap: 'soft',
  showWhitespace: 'none'
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
    lineWrap: config.get<'none' | 'soft' | 'hard'>('lineWrap', DEFAULT_SETTINGS.lineWrap),
    showWhitespace: config.get<'none' | 'boundary' | 'all'>('showWhitespace', DEFAULT_SETTINGS.showWhitespace)
  };
}
