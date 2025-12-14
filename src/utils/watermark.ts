/**
 * Watermark utility for VSPrint
 * Generates CSS/HTML for watermark overlays on printed pages
 */

export type WatermarkPosition = 'center' | 'diagonal' | 'corner';

export interface WatermarkSettings {
  text?: string;
  opacity: number;
  position: WatermarkPosition;
}

export interface WatermarkPreset {
  text: string;
  opacity: number;
  position: WatermarkPosition;
}

/**
 * Predefined watermark presets for common use cases
 */
export const WATERMARK_PRESETS: Record<string, WatermarkPreset> = {
  DRAFT: {
    text: 'DRAFT',
    opacity: 0.15,
    position: 'diagonal'
  },
  CONFIDENTIAL: {
    text: 'CONFIDENTIAL',
    opacity: 0.20,
    position: 'diagonal'
  },
  INTERNAL: {
    text: 'INTERNAL USE ONLY',
    opacity: 0.15,
    position: 'center'
  }
};

/**
 * Validate watermark opacity is within acceptable range
 *
 * @param opacity - Opacity value to validate (0.0-1.0)
 * @returns Clamped opacity value
 */
function validateOpacity(opacity: number): number {
  const clamped = Math.max(0.0, Math.min(1.0, opacity));

  // Warn if opacity is too high and may obstruct content
  if (clamped > 0.5) {
    console.warn(`VSPrint: Watermark opacity ${clamped} may obstruct code readability. Consider using a value <= 0.5`);
  }

  return clamped;
}

/**
 * Get CSS positioning styles for different watermark positions
 *
 * @param position - Watermark position type
 * @returns CSS positioning and transform properties
 */
function getPositionStyles(position: WatermarkPosition): string {
  const positions: Record<WatermarkPosition, string> = {
    center: 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
    diagonal: 'top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);',
    corner: 'top: 10mm; right: 10mm;'
  };

  return positions[position] || positions.center;
}

/**
 * Generate CSS styles for watermark overlay
 *
 * @param settings - Watermark settings
 * @returns CSS string for watermark styling
 */
export function generateWatermarkCss(settings: WatermarkSettings): string {
  if (!settings.text || !settings.text.trim()) {
    return '';
  }

  const validOpacity = validateOpacity(settings.opacity);
  const positionStyles = getPositionStyles(settings.position);

  return `
    .watermark {
      position: fixed;
      ${positionStyles}
      font-size: 72pt;
      font-weight: bold;
      color: rgba(0, 0, 0, ${validOpacity});
      opacity: ${validOpacity};
      pointer-events: none;
      z-index: 9999;
      user-select: none;
      white-space: nowrap;
    }

    @media print {
      .watermark {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `;
}

/**
 * Generate HTML div element for watermark overlay
 *
 * @param settings - Watermark settings
 * @returns HTML string for watermark div
 */
export function generateWatermarkHtml(settings: WatermarkSettings): string {
  if (!settings.text || !settings.text.trim()) {
    return '';
  }

  // Escape HTML entities to prevent XSS
  const escapedText = settings.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return `<div class="watermark">${escapedText}</div>`;
}

/**
 * Get a watermark preset by name
 *
 * @param presetName - Name of preset (DRAFT, CONFIDENTIAL, INTERNAL)
 * @returns Watermark preset settings or undefined if not found
 */
export function getWatermarkPreset(presetName: string): WatermarkPreset | undefined {
  return WATERMARK_PRESETS[presetName.toUpperCase()];
}
