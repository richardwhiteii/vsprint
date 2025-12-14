import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from './logger';

/**
 * Generate a temp file path with timestamp prefix
 *
 * @param prefix - File name prefix
 * @param extension - File extension (including dot)
 * @returns Full path to temp file
 */
export function getTempFilePath(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const filename = `${prefix}-${timestamp}${extension}`;
  return path.join(os.tmpdir(), filename);
}

/**
 * Write content to a temporary file
 *
 * @param content - Content to write
 * @param filename - Full path to temp file
 * @returns Path to created file
 */
export async function writeTempFile(content: string, filename: string): Promise<string> {
  try {
    await fs.writeFile(filename, content, 'utf8');
    logger.info(`Temporary file created: ${filename}`);
    return filename;
  } catch (error) {
    logger.error('Failed to write temporary file', error as Error);
    throw new Error(`Failed to write temporary file: ${(error as Error).message}`);
  }
}

/**
 * Clean up temporary files
 *
 * @param files - Array of file paths to delete
 */
export async function cleanupTempFiles(files: string[]): Promise<void> {
  if (files.length === 0) {
    return;
  }

  logger.info(`Cleaning up ${files.length} temporary file(s)`);

  const results = await Promise.allSettled(
    files.map(async (file) => {
      try {
        await fs.unlink(file);
        logger.info(`Deleted temporary file: ${file}`);
      } catch (error) {
        // File may already be deleted or not exist, log but don't throw
        logger.warn(`Failed to delete temporary file: ${file} - ${(error as Error).message}`);
      }
    })
  );

  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed > 0) {
    logger.warn(`Failed to delete ${failed} temporary file(s)`);
  }
}
