/**
 * QR Code utility for VSPrint
 * Generates QR codes linking to files in repository
 */

import * as QRCode from 'qrcode';
import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type QRCodePosition = 'topRight' | 'bottomRight' | 'topLeft' | 'bottomLeft';

export interface QRCodeSettings {
  enabled: boolean;
  position: QRCodePosition;
}

/**
 * URL pattern matchers for different git hosting services
 */
interface GitUrlPattern {
  pattern: RegExp;
  formatUrl: (match: RegExpMatchArray, filePath: string, lineNumber?: number) => string;
}

const GIT_URL_PATTERNS: GitUrlPattern[] = [
  // GitHub SSH: git@github.com:user/repo.git
  {
    pattern: /git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/,
    formatUrl: (match, filePath, lineNumber) => {
      const [, owner, repo] = match;
      const url = `https://github.com/${owner}/${repo}/blob/main/${filePath}`;
      return lineNumber ? `${url}#L${lineNumber}` : url;
    }
  },
  // GitHub HTTPS: https://github.com/user/repo.git
  {
    pattern: /https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/,
    formatUrl: (match, filePath, lineNumber) => {
      const [, owner, repo] = match;
      const url = `https://github.com/${owner}/${repo}/blob/main/${filePath}`;
      return lineNumber ? `${url}#L${lineNumber}` : url;
    }
  },
  // GitLab SSH: git@gitlab.com:user/repo.git
  {
    pattern: /git@gitlab\.com:([^/]+)\/(.+?)(?:\.git)?$/,
    formatUrl: (match, filePath, lineNumber) => {
      const [, owner, repo] = match;
      const url = `https://gitlab.com/${owner}/${repo}/-/blob/main/${filePath}`;
      return lineNumber ? `${url}#L${lineNumber}` : url;
    }
  },
  // GitLab HTTPS: https://gitlab.com/user/repo.git
  {
    pattern: /https:\/\/gitlab\.com\/([^/]+)\/(.+?)(?:\.git)?$/,
    formatUrl: (match, filePath, lineNumber) => {
      const [, owner, repo] = match;
      const url = `https://gitlab.com/${owner}/${repo}/-/blob/main/${filePath}`;
      return lineNumber ? `${url}#L${lineNumber}` : url;
    }
  },
  // Bitbucket SSH: git@bitbucket.org:user/repo.git
  {
    pattern: /git@bitbucket\.org:([^/]+)\/(.+?)(?:\.git)?$/,
    formatUrl: (match, filePath, lineNumber) => {
      const [, owner, repo] = match;
      const url = `https://bitbucket.org/${owner}/${repo}/src/main/${filePath}`;
      return lineNumber ? `${url}#lines-${lineNumber}` : url;
    }
  },
  // Bitbucket HTTPS: https://bitbucket.org/user/repo.git
  {
    pattern: /https:\/\/bitbucket\.org\/([^/]+)\/(.+?)(?:\.git)?$/,
    formatUrl: (match, filePath, lineNumber) => {
      const [, owner, repo] = match;
      const url = `https://bitbucket.org/${owner}/${repo}/src/main/${filePath}`;
      return lineNumber ? `${url}#lines-${lineNumber}` : url;
    }
  }
];

/**
 * Get git remote URL from workspace
 *
 * @param workspacePath - Workspace root path
 * @returns Git remote URL or undefined if not a git repository
 */
async function getGitRemoteUrl(workspacePath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync('git remote get-url origin', {
      cwd: workspacePath,
      timeout: 5000
    });
    return stdout.trim();
  } catch (error) {
    // Not a git repository or no remote configured
    return undefined;
  }
}

/**
 * Get the current git branch name
 *
 * @param workspacePath - Workspace root path
 * @returns Branch name or 'main' as fallback
 */
async function getGitBranch(workspacePath: string): Promise<string> {
  try {
    const { stdout } = await execAsync('git branch --show-current', {
      cwd: workspacePath,
      timeout: 5000
    });
    const branch = stdout.trim();
    return branch || 'main';
  } catch (error) {
    // Default to main branch
    return 'main';
  }
}

/**
 * Get relative path from workspace root
 *
 * @param absolutePath - Absolute file path
 * @param workspacePath - Workspace root path
 * @returns Relative path from workspace root
 */
function getRelativePath(absolutePath: string, workspacePath: string): string {
  const relativePath = path.relative(workspacePath, absolutePath);
  // Convert Windows paths to Unix-style for URLs
  return relativePath.replace(/\\/g, '/');
}

/**
 * Generate repository URL for a file
 *
 * @param filePath - Absolute path to the file
 * @param lineNumber - Optional line number to link to
 * @returns Repository URL or undefined if unable to generate
 */
export async function generateFileUrl(filePath: string, lineNumber?: number): Promise<string | undefined> {
  // Get workspace root
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return undefined;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;

  // Get git remote URL
  const remoteUrl = await getGitRemoteUrl(workspacePath);
  if (!remoteUrl) {
    return undefined;
  }

  // Get relative path from workspace root
  const relativePath = getRelativePath(filePath, workspacePath);

  // Try to match against known git URL patterns
  for (const { pattern, formatUrl } of GIT_URL_PATTERNS) {
    const match = remoteUrl.match(pattern);
    if (match) {
      // Get current branch to use in URL instead of hardcoded 'main'
      const branch = await getGitBranch(workspacePath);
      let url = formatUrl(match, relativePath, lineNumber);
      // Replace hardcoded 'main' with actual branch
      url = url.replace(/\/(main|master)\//, `/${branch}/`);
      return url;
    }
  }

  // Unsupported git hosting service
  return undefined;
}

/**
 * Generate QR code as data URI
 *
 * @param url - URL to encode in QR code
 * @returns Base64 data URI for QR code image
 */
export async function generateQRCode(url: string): Promise<string> {
  try {
    // Generate QR code with optimal settings for print
    const dataUri = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',  // Medium error correction
      margin: 1,  // Minimal margin
      width: 150,  // Size in pixels (suitable for print)
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return dataUri;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate CSS for QR code positioning
 *
 * @param settings - QR code settings
 * @returns CSS string for QR code positioning
 */
export function generateQRCodeCss(settings: QRCodeSettings): string {
  if (!settings.enabled) {
    return '';
  }

  // Position-specific CSS
  let positionCss = '';
  switch (settings.position) {
    case 'topRight':
      positionCss = 'top: 10mm; right: 10mm;';
      break;
    case 'topLeft':
      positionCss = 'top: 10mm; left: 10mm;';
      break;
    case 'bottomRight':
      positionCss = 'bottom: 10mm; right: 10mm;';
      break;
    case 'bottomLeft':
      positionCss = 'bottom: 10mm; left: 10mm;';
      break;
  }

  return `
    .qrcode-container {
      position: fixed;
      ${positionCss}
      z-index: 1000;
      background: white;
      padding: 8px;
      border: 2px solid #333;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .qrcode-container img {
      display: block;
      width: 150px;
      height: 150px;
    }

    .qrcode-label {
      font-size: 8pt;
      text-align: center;
      margin-top: 4px;
      color: #666;
      font-family: Arial, sans-serif;
    }

    @media print {
      .qrcode-container {
        position: absolute;
        ${positionCss}
        page-break-inside: avoid;
      }
    }
  `;
}

/**
 * Generate HTML for QR code
 *
 * @param qrCodeDataUri - Base64 data URI for QR code image
 * @param url - URL that QR code links to (for accessibility)
 * @returns HTML string for QR code section
 */
export function generateQRCodeHtml(qrCodeDataUri: string, url: string): string {
  // Escape URL for HTML attributes
  const escapedUrl = url
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return `
    <div class="qrcode-container">
      <img src="${qrCodeDataUri}" alt="QR Code linking to ${escapedUrl}" />
      <div class="qrcode-label">Scan to view file</div>
    </div>
  `;
}

/**
 * Generate QR code for file if enabled in settings
 *
 * @param filePath - Absolute path to the file
 * @param settings - QR code settings
 * @returns Object with CSS and HTML strings, or empty strings if disabled/unavailable
 */
export async function generateFileQRCode(
  filePath: string,
  settings: QRCodeSettings
): Promise<{ css: string; html: string }> {
  // Return empty if QR code is disabled
  if (!settings.enabled) {
    return { css: '', html: '' };
  }

  try {
    // Generate repository URL for the file
    const url = await generateFileUrl(filePath);
    if (!url) {
      // No git repository or unsupported hosting service
      return { css: '', html: '' };
    }

    // Generate QR code
    const qrCodeDataUri = await generateQRCode(url);

    // Generate CSS and HTML
    const css = generateQRCodeCss(settings);
    const html = generateQRCodeHtml(qrCodeDataUri, url);

    return { css, html };
  } catch (error) {
    // Log error but don't fail the print operation
    console.error('Failed to generate QR code:', error);
    return { css: '', html: '' };
  }
}
