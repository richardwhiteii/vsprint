import * as vscode from 'vscode';
import { logger } from './logger';

/**
 * Progress reporter callback for tracking operation progress
 */
export type ProgressCallback = (current: number, total: number, message?: string) => void;

/**
 * PDF job for background processing
 */
export interface PdfJob {
  id: string;
  html: string;
  options: any;
  outputPath: string;
  fileName: string;
  startTime: number;
  resolve: (buffer: Buffer) => void;
  reject: (error: Error) => void;
  cancellationToken?: vscode.CancellationToken;
}

/**
 * Progress reporter wrapper for VS Code progress API
 * Provides convenient methods for reporting progress with percentage and time estimates
 */
export class ProgressReporter {
  private progress: vscode.Progress<{ message?: string; increment?: number }>;
  private currentProgress: number = 0;

  constructor(progress: vscode.Progress<{ message?: string; increment?: number }>) {
    this.progress = progress;
  }

  /**
   * Report progress with a message
   */
  report(message: string, increment?: number): void {
    if (increment !== undefined) {
      this.currentProgress += increment;
    }
    this.progress.report({ message, increment });
  }

  /**
   * Report progress with percentage
   */
  reportPercentage(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const increment = percentage - this.currentProgress;

    if (increment > 0) {
      this.currentProgress = percentage;
      const msg = message ? `${message} (${percentage}%)` : `${percentage}%`;
      this.progress.report({ message: msg, increment });
    }
  }

  /**
   * Report progress with estimated time remaining
   */
  reportWithTime(
    current: number,
    total: number,
    startTime: number,
    message?: string
  ): void {
    const percentage = Math.round((current / total) * 100);
    const elapsed = Date.now() - startTime;
    const estimated = (elapsed / current) * (total - current);
    const remaining = Math.ceil(estimated / 1000); // Convert to seconds

    let timeStr = '';
    if (remaining > 60) {
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      timeStr = `~${minutes}m ${seconds}s remaining`;
    } else if (remaining > 0) {
      timeStr = `~${remaining}s remaining`;
    }

    const msg = message
      ? `${message} (${percentage}%) ${timeStr}`
      : `${percentage}% ${timeStr}`;

    const increment = percentage - this.currentProgress;
    if (increment > 0) {
      this.currentProgress = percentage;
      this.progress.report({ message: msg, increment });
    }
  }
}

/**
 * Job queue for background PDF generation
 * Processes PDF generation jobs sequentially to avoid overwhelming system resources
 */
export class PdfJobQueue {
  private queue: PdfJob[] = [];
  private isProcessing: boolean = false;
  private currentJob: PdfJob | null = null;

  /**
   * Add a PDF generation job to the queue
   */
  async enqueue(
    html: string,
    options: any,
    outputPath: string,
    fileName: string,
    cancellationToken?: vscode.CancellationToken
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const job: PdfJob = {
        id: `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        html,
        options,
        outputPath,
        fileName,
        startTime: Date.now(),
        resolve,
        reject,
        cancellationToken
      };

      this.queue.push(job);
      logger.info(`PDF job queued: ${job.id} (queue size: ${this.queue.length})`);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Get the current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if a job is currently being processed
   */
  isJobProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Get current job information
   */
  getCurrentJob(): { id: string; fileName: string; startTime: number } | null {
    if (!this.currentJob) {
      return null;
    }
    return {
      id: this.currentJob.id,
      fileName: this.currentJob.fileName,
      startTime: this.currentJob.startTime
    };
  }

  /**
   * Process jobs in the queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) {
        break;
      }

      this.currentJob = job;
      logger.info(`Processing PDF job: ${job.id}`);

      try {
        // Check if job was cancelled before processing
        if (job.cancellationToken?.isCancellationRequested) {
          logger.info(`PDF job cancelled before processing: ${job.id}`);
          job.reject(new Error('PDF generation was cancelled'));
          continue;
        }

        // Import PDF renderer (lazy load)
        const { renderToPdf } = await import('../renderers/pdfRenderer');

        // Generate PDF with cancellation support
        const buffer = await this.renderWithCancellation(
          renderToPdf,
          job.html,
          job.options,
          job.cancellationToken
        );

        logger.info(`PDF job completed: ${job.id} (${buffer.length} bytes)`);
        job.resolve(buffer);

      } catch (error) {
        logger.error(`PDF job failed: ${job.id}`, error as Error);
        job.reject(error as Error);
      } finally {
        this.currentJob = null;
      }
    }

    this.isProcessing = false;
    logger.info('PDF job queue processing completed');
  }

  /**
   * Render PDF with cancellation support
   */
  private async renderWithCancellation(
    renderFn: (html: string, options: any, cancellationToken?: vscode.CancellationToken) => Promise<Buffer>,
    html: string,
    options: any,
    cancellationToken?: vscode.CancellationToken
  ): Promise<Buffer> {
    return renderFn(html, options, cancellationToken);
  }
}

/**
 * Global PDF job queue instance
 */
const pdfJobQueue = new PdfJobQueue();

/**
 * Get the global PDF job queue
 */
export function getPdfJobQueue(): PdfJobQueue {
  return pdfJobQueue;
}

/**
 * Show progress with vscode.window.withProgress wrapper
 * Provides a convenient way to show progress for long-running operations
 */
export async function withProgress<T>(
  title: string,
  task: (reporter: ProgressReporter, token: vscode.CancellationToken) => Promise<T>,
  cancellable: boolean = false
): Promise<T> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable
    },
    async (progress, token) => {
      const reporter = new ProgressReporter(progress);
      return task(reporter, token);
    }
  );
}
