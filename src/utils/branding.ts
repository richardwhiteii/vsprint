/**
 * Branding utility for VSPrint
 * Embeds company logos and branding in print output
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export type BrandingPosition = 'header' | 'footer';

export interface BrandingSettings {
  logo?: string;
  companyName?: string;
  position: BrandingPosition;
}

/**
 * MIME type mapping for common image formats
 */
const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  webp: 'image/webp'
};

/**
 * Maximum logo file size (1MB)
 */
const MAX_LOGO_SIZE = 1024 * 1024;

/**
 * Validate logo file exists and is within size limits
 *
 * @param logoPath - Absolute or workspace-relative path to logo file
 * @param workspaceRoot - Workspace root path for resolving relative paths
 * @returns Resolved absolute path if valid
 * @throws Error if file doesn't exist or is too large
 */
async function validateLogoFile(logoPath: string, workspaceRoot?: string): Promise<string> {
  // Resolve relative paths to workspace root
  let absolutePath = logoPath;
  if (!path.isAbsolute(logoPath) && workspaceRoot) {
    absolutePath = path.join(workspaceRoot, logoPath);
  }

  // Check if file exists
  try {
    const stats = await fs.promises.stat(absolutePath);

    if (!stats.isFile()) {
      throw new Error(`Logo path is not a file: ${absolutePath}`);
    }

    // Validate file size
    if (stats.size > MAX_LOGO_SIZE) {
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Logo file too large (${sizeMB}MB). Maximum size is 1MB.`);
    }

    return absolutePath;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Logo file not found: ${absolutePath}`);
    }
    throw error;
  }
}

/**
 * Detect MIME type from file extension
 *
 * @param filePath - Path to image file
 * @returns MIME type string
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return MIME_TYPES[ext] || 'image/png';
}

/**
 * Embed logo as base64 data URI for portability
 *
 * @param logoPath - Path to logo file (absolute or workspace-relative)
 * @param workspaceRoot - Optional workspace root for resolving relative paths
 * @returns Base64 data URI string
 * @throws Error if file validation fails
 */
export async function embedLogo(logoPath: string, workspaceRoot?: string): Promise<string> {
  // Validate file and get absolute path
  const absolutePath = await validateLogoFile(logoPath, workspaceRoot);

  try {
    // Read file contents
    const content = await fs.promises.readFile(absolutePath);

    // Convert to base64
    const base64 = content.toString('base64');

    // Detect MIME type
    const mimeType = getMimeType(absolutePath);

    // Return data URI
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to embed logo: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate CSS styles for branding
 *
 * @param settings - Branding settings
 * @returns CSS string for branding styles
 */
export function generateBrandingCss(settings: BrandingSettings): string {
  if (!settings.logo && !settings.companyName) {
    return '';
  }

  return `
    .branding {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 10px 0;
    }

    .branding-logo {
      max-height: 40px;
      max-width: 200px;
      height: auto;
      width: auto;
      object-fit: contain;
    }

    .branding-company-name {
      font-size: 14pt;
      font-weight: bold;
      color: #333;
    }

    .branding-header {
      border-bottom: 1px solid #ccc;
      margin-bottom: 15px;
    }

    .branding-footer {
      border-top: 1px solid #ccc;
      margin-top: 15px;
    }

    @media print {
      .branding {
        page-break-inside: avoid;
      }
    }
  `;
}

/**
 * Generate HTML for branding section
 *
 * @param settings - Branding settings
 * @param logoDataUri - Optional base64 data URI for logo (if not provided, logo won't be shown)
 * @returns HTML string for branding section
 */
export function generateBrandingHtml(settings: BrandingSettings, logoDataUri?: string): string {
  if (!settings.logo && !settings.companyName) {
    return '';
  }

  // Escape company name to prevent XSS
  const escapedCompanyName = settings.companyName
    ? settings.companyName
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    : '';

  const positionClass = settings.position === 'header' ? 'branding-header' : 'branding-footer';

  let brandingContent = '';

  // Add logo if data URI is provided
  if (logoDataUri) {
    brandingContent += `<img src="${logoDataUri}" alt="Company Logo" class="branding-logo">`;
  }

  // Add company name if provided
  if (escapedCompanyName) {
    brandingContent += `<span class="branding-company-name">${escapedCompanyName}</span>`;
  }

  if (!brandingContent) {
    return '';
  }

  return `<div class="branding ${positionClass}">${brandingContent}</div>`;
}

/**
 * Get workspace root path from VS Code workspace
 *
 * @returns Workspace root path or undefined
 */
export function getWorkspaceRoot(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  return workspaceFolders && workspaceFolders.length > 0
    ? workspaceFolders[0].uri.fsPath
    : undefined;
}
