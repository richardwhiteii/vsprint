/**
 * File filter utility for VSPrint
 * Implements glob pattern matching for file exclusion
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Convert glob pattern to RegExp
 * Supports basic glob syntax: *, **, ?, [abc]
 *
 * @param pattern - Glob pattern string
 * @returns RegExp for matching file paths
 */
function globToRegex(pattern: string): RegExp {
  // Escape special regex characters except glob wildcards
  let regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\+/g, '\\+')
    .replace(/\^/g, '\\^')
    .replace(/\$/g, '\\$')
    .replace(/\|/g, '\\|');

  // Convert glob wildcards to regex
  regexPattern = regexPattern
    .replace(/\*\*/g, '__DOUBLESTAR__')  // Temporarily replace ** to handle separately
    .replace(/\*/g, '[^/]*')              // * matches anything except /
    .replace(/__DOUBLESTAR__/g, '.*')     // ** matches anything including /
    .replace(/\?/g, '[^/]');              // ? matches any single character except /

  // Anchors for full path matching
  return new RegExp(`^${regexPattern}$`);
}

/**
 * Check if file path matches any of the glob patterns
 *
 * @param filePath - File path to test (relative or absolute)
 * @param patterns - Array of glob patterns
 * @returns True if file matches any pattern
 */
export function matchesPattern(filePath: string, patterns: string[]): boolean {
  if (!patterns || patterns.length === 0) {
    return false;
  }

  // Normalize path separators to forward slashes
  const normalizedPath = filePath.replace(/\\/g, '/');

  return patterns.some(pattern => {
    const regex = globToRegex(pattern);
    return regex.test(normalizedPath);
  });
}

/**
 * Check if file should be excluded based on patterns
 *
 * @param filePath - File path to test
 * @param excludePatterns - Array of glob patterns for exclusion
 * @returns True if file should be excluded
 */
export function shouldExcludeFile(filePath: string, excludePatterns: string[]): boolean {
  return matchesPattern(filePath, excludePatterns);
}

/**
 * Load and parse .gitignore patterns
 *
 * @param workspaceRoot - Workspace root directory path
 * @returns Array of glob patterns from .gitignore
 */
export async function loadGitignorePatterns(workspaceRoot: string): Promise<string[]> {
  const gitignorePath = path.join(workspaceRoot, '.gitignore');

  try {
    const content = await fs.promises.readFile(gitignorePath, 'utf-8');

    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Remove empty lines and comments
        return line && !line.startsWith('#');
      })
      .map(line => {
        // Remove trailing comments
        const commentIndex = line.indexOf('#');
        if (commentIndex > 0) {
          return line.substring(0, commentIndex).trim();
        }
        return line;
      })
      .filter(line => line.length > 0);
  } catch (error) {
    // .gitignore doesn't exist or can't be read
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Filter file list based on exclusion patterns
 *
 * @param files - Array of file paths to filter
 * @param excludePatterns - Array of glob patterns for exclusion
 * @param workspaceRoot - Optional workspace root for making paths relative
 * @returns Filtered array of file paths
 */
export function filterFiles(
  files: string[],
  excludePatterns: string[],
  workspaceRoot?: string
): string[] {
  if (!excludePatterns || excludePatterns.length === 0) {
    return files;
  }

  return files.filter(file => {
    // Make path relative to workspace root for pattern matching
    let relativePath = file;
    if (workspaceRoot && path.isAbsolute(file)) {
      relativePath = path.relative(workspaceRoot, file);
    }

    return !shouldExcludeFile(relativePath, excludePatterns);
  });
}

/**
 * Merge .gitignore patterns with user-defined exclusion patterns
 *
 * @param userPatterns - User-defined exclusion patterns
 * @param gitignorePatterns - Patterns from .gitignore
 * @returns Combined array of patterns
 */
export function mergeExclusionPatterns(
  userPatterns: string[],
  gitignorePatterns: string[]
): string[] {
  // Remove duplicates using Set
  const combined = new Set([...userPatterns, ...gitignorePatterns]);
  return Array.from(combined);
}
