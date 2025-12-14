import * as vscode from 'vscode';
import { ColorScheme } from '../utils/cssLoader';

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
  foldedRegions: 'expand' | 'collapse' | 'asIs';
  showSeparators: boolean;
  headerTemplate: string;
  footerTemplate: string;
  columns: 1 | 2 | 4;
  customCss?: string;
  colorScheme?: ColorScheme;
  builtinTheme?: 'default' | 'codeReview' | 'minimal' | 'documentation' | 'grayscale';
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
  showWhitespace: 'none',
  foldedRegions: 'expand',
  showSeparators: false,
  headerTemplate: '{filename}',
  footerTemplate: 'Page {page} of {pages}',
  columns: 1,
  customCss: undefined,
  colorScheme: undefined,
  builtinTheme: 'default'
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
    showWhitespace: config.get<'none' | 'boundary' | 'all'>('showWhitespace', DEFAULT_SETTINGS.showWhitespace),
    foldedRegions: config.get<'expand' | 'collapse' | 'asIs'>('foldedRegions', DEFAULT_SETTINGS.foldedRegions),
    showSeparators: config.get<boolean>('showSeparators', DEFAULT_SETTINGS.showSeparators),
    headerTemplate: config.get<string>('header.template', DEFAULT_SETTINGS.headerTemplate),
    footerTemplate: config.get<string>('footer.template', DEFAULT_SETTINGS.footerTemplate),
    columns: config.get<1 | 2 | 4>('columns', DEFAULT_SETTINGS.columns),
    customCss: config.get<string>('customCss') || DEFAULT_SETTINGS.customCss,
    colorScheme: config.get<ColorScheme>('colorScheme') || DEFAULT_SETTINGS.colorScheme,
    builtinTheme: config.get<'default' | 'codeReview' | 'minimal' | 'documentation' | 'grayscale'>('builtinTheme') || DEFAULT_SETTINGS.builtinTheme
  };
}
