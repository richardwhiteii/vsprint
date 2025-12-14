/**
 * Utilities for transforming and visualizing text content
 */

/**
 * Visualize whitespace characters in HTML content
 *
 * This function adds visual markers for spaces and tabs while preserving
 * existing HTML tags from syntax highlighting (e.g., Shiki <span> tags).
 *
 * @param html - HTML content (may contain Shiki <span> tags)
 * @param mode - Visualization mode: 'none' | 'boundary' | 'all'
 * @returns HTML with whitespace markers
 */
export function visualizeWhitespace(html: string, mode: 'none' | 'boundary' | 'all'): string {
  if (mode === 'none') {
    return html;
  }

  // Split content into HTML tags and text segments
  // This regex matches HTML tags: <...> including attributes
  const segments: Array<{ isTag: boolean; content: string }> = [];
  const tagRegex = /<[^>]+>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    // Add text before tag
    if (match.index > lastIndex) {
      segments.push({
        isTag: false,
        content: html.substring(lastIndex, match.index)
      });
    }
    // Add tag
    segments.push({
      isTag: true,
      content: match[0]
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last tag
  if (lastIndex < html.length) {
    segments.push({
      isTag: false,
      content: html.substring(lastIndex)
    });
  }

  // Process each segment
  const result = segments.map(segment => {
    if (segment.isTag) {
      // Don't modify HTML tags
      return segment.content;
    }

    // Transform text content based on mode
    let text = segment.content;

    if (mode === 'all') {
      // Replace all spaces and tabs
      text = text.replace(/\t/g, '<span class="ws-tab">→</span>');
      text = text.replace(/ /g, '<span class="ws-space">·</span>');
    } else if (mode === 'boundary') {
      // Replace spaces between words (spaces followed by non-space)
      // Use a more sophisticated approach: mark spaces that are between visible characters

      // First, replace tabs (always visible in boundary mode)
      text = text.replace(/\t/g, '<span class="ws-tab">→</span>');

      // For boundary mode, mark spaces that separate words
      // Look for pattern: non-space + spaces + non-space
      // This regex matches one or more spaces that are followed by a non-space character
      text = text.replace(/ +(?=\S)/g, (match) => {
        // Replace each space in the match
        return match.split('').map(() => '<span class="ws-space">·</span>').join('');
      });
    }

    return text;
  }).join('');

  return result;
}
