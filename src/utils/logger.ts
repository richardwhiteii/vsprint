import * as vscode from 'vscode';

/**
 * Logger utility for VSPrint extension
 * Provides centralized logging to VS Code output channel
 */
class Logger {
  private outputChannel: vscode.OutputChannel | undefined;

  /**
   * Initialize the logger with an output channel
   */
  public initialize(channelName: string): void {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }

  /**
   * Log an info message
   */
  public info(message: string): void {
    this.log('INFO', message);
  }

  /**
   * Log a warning message
   */
  public warn(message: string): void {
    this.log('WARN', message);
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: Error): void {
    const errorMessage = error ? `${message}: ${error.message}` : message;
    this.log('ERROR', errorMessage);
    if (error?.stack) {
      this.log('ERROR', error.stack);
    }
  }

  /**
   * Internal logging method
   */
  private log(level: string, message: string): void {
    if (!this.outputChannel) {
      console.warn('Logger not initialized');
      return;
    }
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
  }

  /**
   * Get the output channel instance
   */
  public getOutputChannel(): vscode.OutputChannel | undefined {
    return this.outputChannel;
  }

  /**
   * Dispose the output channel
   */
  public dispose(): void {
    this.outputChannel?.dispose();
  }
}

// Export singleton instance
export const logger = new Logger();
