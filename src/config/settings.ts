import * as vscode from 'vscode';
import { ColorScheme } from '../utils/cssLoader';
import { WatermarkPosition } from '../utils/watermark';
import { BrandingPosition } from '../utils/branding';

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
  watermark?: {
    text?: string;
    opacity: number;
    position: WatermarkPosition;
  };
  branding?: {
    logo?: string;
    companyName?: string;
    position: BrandingPosition;
  };
  exclude?: string[];
  respectGitignore?: boolean;
  diff?: {
    mode: 'unified' | 'sideBySide';
    showLineNumbers: boolean;
    contextLines: number;
  };
  notebook?: {
    showCellNumbers: boolean;
    showOutputs: boolean;
    maxOutputLines: number;
  };
  markdown?: {
    embedImages: boolean;
  };
  blame?: {
    showAuthor: boolean;
    showDate: boolean;
    dateFormat: 'relative' | 'absolute';
  };
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
  builtinTheme: 'default',
  watermark: {
    text: '',
    opacity: 0.15,
    position: 'diagonal'
  },
  branding: {
    logo: '',
    companyName: '',
    position: 'header'
  },
  exclude: [],
  respectGitignore: true,
  diff: {
    mode: 'sideBySide',
    showLineNumbers: true,
    contextLines: 3
  },
  notebook: {
    showCellNumbers: true,
    showOutputs: true,
    maxOutputLines: 100
  },
  markdown: {
    embedImages: true
  },
  blame: {
    showAuthor: true,
    showDate: true,
    dateFormat: 'relative'
  }
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
    headerTemplate: config.get<string>('header.template') ?? DEFAULT_SETTINGS.headerTemplate,
    footerTemplate: config.get<string>('footer.template') ?? DEFAULT_SETTINGS.footerTemplate,
    columns: config.get<1 | 2 | 4>('columns') ?? DEFAULT_SETTINGS.columns,
    customCss: config.get<string>('customCss') || DEFAULT_SETTINGS.customCss,
    colorScheme: config.get<ColorScheme>('colorScheme') || DEFAULT_SETTINGS.colorScheme,
    builtinTheme: config.get<'default' | 'codeReview' | 'minimal' | 'documentation' | 'grayscale'>('builtinTheme') || DEFAULT_SETTINGS.builtinTheme,
    watermark: {
      text: config.get<string>('watermark.text') ?? DEFAULT_SETTINGS.watermark!.text,
      opacity: config.get<number>('watermark.opacity') ?? DEFAULT_SETTINGS.watermark!.opacity,
      position: config.get<WatermarkPosition>('watermark.position') ?? DEFAULT_SETTINGS.watermark!.position
    },
    branding: {
      logo: config.get<string>('branding.logo') ?? DEFAULT_SETTINGS.branding!.logo,
      companyName: config.get<string>('branding.companyName') ?? DEFAULT_SETTINGS.branding!.companyName,
      position: config.get<BrandingPosition>('branding.position') ?? DEFAULT_SETTINGS.branding!.position
    },
    exclude: config.get<string[]>('exclude', DEFAULT_SETTINGS.exclude!),
    respectGitignore: config.get<boolean>('respectGitignore', DEFAULT_SETTINGS.respectGitignore!),
    diff: {
      mode: config.get<'unified' | 'sideBySide'>('diff.mode', DEFAULT_SETTINGS.diff!.mode),
      showLineNumbers: config.get<boolean>('diff.showLineNumbers', DEFAULT_SETTINGS.diff!.showLineNumbers),
      contextLines: config.get<number>('diff.contextLines', DEFAULT_SETTINGS.diff!.contextLines)
    },
    notebook: {
      showCellNumbers: config.get<boolean>('notebook.showCellNumbers', DEFAULT_SETTINGS.notebook!.showCellNumbers),
      showOutputs: config.get<boolean>('notebook.showOutputs', DEFAULT_SETTINGS.notebook!.showOutputs),
      maxOutputLines: config.get<number>('notebook.maxOutputLines', DEFAULT_SETTINGS.notebook!.maxOutputLines)
    },
    markdown: {
      embedImages: config.get<boolean>('markdown.embedImages', DEFAULT_SETTINGS.markdown!.embedImages)
    },
    blame: {
      showAuthor: config.get<boolean>('blame.showAuthor', DEFAULT_SETTINGS.blame!.showAuthor),
      showDate: config.get<boolean>('blame.showDate', DEFAULT_SETTINGS.blame!.showDate),
      dateFormat: config.get<'relative' | 'absolute'>('blame.dateFormat', DEFAULT_SETTINGS.blame!.dateFormat)
    }
  };
}
