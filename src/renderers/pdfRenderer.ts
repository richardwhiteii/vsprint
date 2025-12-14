import puppeteer, { Browser, PDFOptions } from 'puppeteer';
import { logger } from '../utils/logger';

/**
 * PDF margin configuration (in millimeters)
 */
export interface PdfMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Custom paper size dimensions (in millimeters)
 */
export interface CustomPaperSize {
  width: number;
  height: number;
}

/**
 * PDF generation options
 */
export interface PdfOptions {
  margins: PdfMargins;
  orientation: 'portrait' | 'landscape';
  paperSize: 'A4' | 'Letter' | 'Legal' | 'custom';
  customSize?: CustomPaperSize;
}

/**
 * Standard paper size dimensions in millimeters
 */
const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 }
} as const;


/**
 * Get paper dimensions based on configuration
 *
 * @param options - PDF generation options
 * @returns Paper width and height in millimeters
 */
function getPaperDimensions(options: PdfOptions): { width: number; height: number } {
  if (options.paperSize === 'custom') {
    if (!options.customSize) {
      throw new Error('Custom paper size selected but customSize not provided');
    }
    return options.customSize;
  }

  const dimensions = PAPER_SIZES[options.paperSize];

  // Swap dimensions for landscape orientation
  if (options.orientation === 'landscape') {
    return { width: dimensions.height, height: dimensions.width };
  }

  return dimensions;
}

/**
 * Build Puppeteer PDF options from configuration
 *
 * @param options - PDF generation options
 * @returns Puppeteer PDFOptions object
 */
function buildPuppeteerOptions(options: PdfOptions): PDFOptions {
  const dimensions = getPaperDimensions(options);

  // Build the PDF options object
  const pdfOptions: PDFOptions = {
    // Use custom dimensions instead of format for precise control
    width: `${dimensions.width}mm`,
    height: `${dimensions.height}mm`,

    // Apply margins (Puppeteer accepts string with units or numbers in inches)
    margin: {
      top: `${options.margins.top}mm`,
      bottom: `${options.margins.bottom}mm`,
      left: `${options.margins.left}mm`,
      right: `${options.margins.right}mm`
    },

    // Print background graphics (important for syntax highlighting)
    printBackground: true,

    // Prefer CSS page size (allows for more precise control)
    preferCSSPageSize: false
  };

  logger.info(`PDF options: ${JSON.stringify({
    size: `${dimensions.width}x${dimensions.height}mm`,
    orientation: options.orientation,
    margins: options.margins
  })}`);

  return pdfOptions;
}

/**
 * Launch headless Chrome browser
 *
 * @returns Browser instance
 * @throws Error if browser fails to launch
 */
async function launchBrowser(): Promise<Browser> {
  try {
    logger.info('Launching headless Chrome browser');

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    logger.info('Browser launched successfully');
    return browser;

  } catch (error) {
    logger.error('Failed to launch browser', error as Error);
    throw new Error(
      `Failed to launch Chrome browser: ${(error as Error).message}. ` +
      'Ensure Chromium is installed via Puppeteer.'
    );
  }
}

/**
 * Generate PDF from HTML content using Puppeteer
 *
 * @param html - HTML content to convert to PDF
 * @param options - PDF generation options
 * @returns PDF file as Buffer
 * @throws Error if PDF generation fails
 */
export async function renderToPdf(html: string, options: PdfOptions): Promise<Buffer> {
  logger.info('Starting PDF generation');

  let browser: Browser | null = null;

  try {
    // Launch browser
    browser = await launchBrowser();

    // Create new page
    const page = await browser.newPage();
    logger.info('New page created');

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1
    });

    // Set HTML content and wait for resources to load
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000 // 30 second timeout
    });
    logger.info('HTML content loaded successfully');

    // Build Puppeteer options
    const puppeteerOptions = buildPuppeteerOptions(options);

    // Generate PDF
    logger.info('Generating PDF buffer');
    const pdfUint8Array = await page.pdf(puppeteerOptions);

    if (!pdfUint8Array || pdfUint8Array.length === 0) {
      throw new Error('PDF generation produced empty buffer');
    }

    // Convert Uint8Array to Buffer
    const pdfBuffer = Buffer.from(pdfUint8Array);

    logger.info(`PDF generated successfully (${pdfBuffer.length} bytes)`);
    return pdfBuffer;

  } catch (error) {
    logger.error('PDF generation failed', error as Error);

    // Provide user-friendly error messages
    if ((error as Error).message.includes('timeout')) {
      throw new Error('PDF generation timed out. The content may be too large or complex.');
    }

    throw new Error(`PDF generation failed: ${(error as Error).message}`);

  } finally {
    // Always close browser to prevent resource leaks
    if (browser) {
      try {
        await browser.close();
        logger.info('Browser closed successfully');
      } catch (closeError) {
        logger.error('Failed to close browser', closeError as Error);
      }
    }
  }
}

/**
 * Validate PDF options
 *
 * @param options - PDF options to validate
 * @throws Error if options are invalid
 */
export function validatePdfOptions(options: PdfOptions): void {
  // Validate margins
  if (options.margins.top < 0 || options.margins.bottom < 0 ||
      options.margins.left < 0 || options.margins.right < 0) {
    throw new Error('PDF margins cannot be negative');
  }

  // Validate orientation
  if (options.orientation !== 'portrait' && options.orientation !== 'landscape') {
    throw new Error('PDF orientation must be "portrait" or "landscape"');
  }

  // Validate paper size
  const validSizes = ['A4', 'Letter', 'Legal', 'custom'];
  if (!validSizes.includes(options.paperSize)) {
    throw new Error(`PDF paper size must be one of: ${validSizes.join(', ')}`);
  }

  // Validate custom size if specified
  if (options.paperSize === 'custom') {
    if (!options.customSize) {
      throw new Error('Custom paper size requires customSize to be specified');
    }
    if (options.customSize.width <= 0 || options.customSize.height <= 0) {
      throw new Error('Custom paper dimensions must be greater than zero');
    }
  }
}
