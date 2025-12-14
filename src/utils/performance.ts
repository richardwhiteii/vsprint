import * as vscode from 'vscode';

/**
 * Performance configuration interface
 */
export interface PerformanceConfig {
  maxLines: number;
  chunkSize: number;
  cacheEnabled: boolean;
  cacheSize: number;
}

/**
 * LRU cache entry
 */
interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
}

/**
 * LRU (Least Recently Used) cache for rendered content
 * Implements a simple cache with configurable size
 */
export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      // Update timestamp for LRU tracking
      entry.timestamp = Date.now();
      return entry.value;
    }
    return undefined;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // If cache is full, remove least recently used
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

/**
 * Global render cache instance
 */
const renderCache = new LRUCache<string>(50);

/**
 * Generate cache key from content and settings
 */
export function generateCacheKey(
  filePath: string,
  lineCount: number,
  settingsHash: string
): string {
  return `${filePath}:${lineCount}:${settingsHash}`;
}

/**
 * Get cached rendered content
 */
export function getCachedRender(cacheKey: string): string | undefined {
  return renderCache.get(cacheKey);
}

/**
 * Cache rendered content
 */
export function setCachedRender(cacheKey: string, html: string): void {
  renderCache.set(cacheKey, html);
}

/**
 * Clear render cache
 */
export function clearRenderCache(): void {
  renderCache.clear();
}

/**
 * Check if file is large and should use streaming
 */
export function isLargeFile(lineCount: number, maxLines: number = 5000): boolean {
  return lineCount > maxLines;
}

/**
 * Show warning dialog for large files and ask for confirmation
 */
export async function confirmLargeFileRender(lineCount: number): Promise<boolean> {
  const message = `This file has ${lineCount} lines, which may take some time to render. Continue?`;
  const result = await vscode.window.showWarningMessage(
    message,
    { modal: true },
    'Continue',
    'Cancel'
  );

  return result === 'Continue';
}

/**
 * Content chunk for streaming rendering
 */
export interface ContentChunk {
  startLine: number;
  endLine: number;
  content: string;
}

/**
 * Split content into chunks for streaming rendering
 * Yields chunks of approximately chunkSize lines
 */
export function* chunkContent(
  content: string,
  chunkSize: number = 1000
): Generator<ContentChunk> {
  const lines = content.split('\n');
  const totalLines = lines.length;

  for (let startLine = 0; startLine < totalLines; startLine += chunkSize) {
    const endLine = Math.min(startLine + chunkSize, totalLines);
    const chunkLines = lines.slice(startLine, endLine);

    yield {
      startLine: startLine + 1, // 1-based line numbers
      endLine,
      content: chunkLines.join('\n')
    };
  }
}

/**
 * Render content chunk by chunk with progress tracking
 * Returns a generator that yields HTML chunks
 */
export async function* streamingRender(
  content: string,
  renderFn: (chunk: string, startLine: number) => Promise<string>,
  chunkSize: number = 1000,
  progressCallback?: (current: number, total: number) => void
): AsyncGenerator<string> {
  const lines = content.split('\n');
  const totalLines = lines.length;
  const totalChunks = Math.ceil(totalLines / chunkSize);

  let currentChunk = 0;

  for (const chunk of chunkContent(content, chunkSize)) {
    currentChunk++;

    // Report progress
    if (progressCallback) {
      progressCallback(currentChunk, totalChunks);
    }

    // Render chunk
    const renderedChunk = await renderFn(chunk.content, chunk.startLine);
    yield renderedChunk;

    // Yield control to event loop to avoid blocking UI
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
}

/**
 * Process content in chunks to avoid UI blocking
 * Useful for CPU-intensive operations like syntax highlighting
 */
export async function chunkedProcess<T>(
  items: T[],
  processFn: (item: T) => Promise<void>,
  chunkSize: number = 100
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, Math.min(i + chunkSize, items.length));

    // Process chunk
    for (const item of chunk) {
      await processFn(item);
    }

    // Yield control to event loop
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
}

/**
 * Get performance configuration from VS Code settings
 */
export function getPerformanceConfig(): PerformanceConfig {
  const config = vscode.workspace.getConfiguration('vsprint.performance');

  return {
    maxLines: config.get<number>('maxLines', 5000),
    chunkSize: config.get<number>('chunkSize', 1000),
    cacheEnabled: config.get<boolean>('cacheEnabled', true),
    cacheSize: config.get<number>('cacheSize', 50)
  };
}

/**
 * Hash settings object to string for cache key generation
 * Creates a deterministic string representation of settings
 */
export function hashSettings(settings: any): string {
  // Convert settings to a sorted JSON string for consistent hashing
  const sortedKeys = Object.keys(settings).sort();
  const pairs = sortedKeys.map(key => `${key}:${JSON.stringify(settings[key])}`);
  return pairs.join('|');
}
