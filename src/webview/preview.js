// VSPrint Preview Panel Client-Side Script

(function () {
  // Get VS Code API
  const vscode = acquireVsCodeApi();

  // State
  let currentZoom = 100;
  let currentPage = 1;
  let totalPages = 1;

  // DOM Elements
  const previewContainer = document.getElementById('preview');
  const zoomLevel = document.getElementById('zoomLevel');
  const pageInfo = document.getElementById('pageInfo');

  // Zoom levels (50%, 75%, 100%, 125%, 150%, 200%)
  const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];

  /**
   * Initialize event listeners
   */
  function init() {
    // Zoom buttons
    document.getElementById('zoomIn').addEventListener('click', zoomIn);
    document.getElementById('zoomOut').addEventListener('click', zoomOut);

    // Preset zoom buttons
    document.getElementById('zoom50').addEventListener('click', () => setZoom(50));
    document.getElementById('zoom75').addEventListener('click', () => setZoom(75));
    document.getElementById('zoom100').addEventListener('click', () => setZoom(100));
    document.getElementById('zoom125').addEventListener('click', () => setZoom(125));
    document.getElementById('zoom150').addEventListener('click', () => setZoom(150));
    document.getElementById('zoom200').addEventListener('click', () => setZoom(200));

    // Action buttons
    document.getElementById('refreshBtn').addEventListener('click', refresh);
    document.getElementById('printBtn').addEventListener('click', print);
    document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Notify extension that webview is ready
    vscode.postMessage({ type: 'ready' });
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyboard(event) {
    // Ctrl/Cmd + Plus/Equal: Zoom In
    if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=')) {
      event.preventDefault();
      zoomIn();
    }
    // Ctrl/Cmd + Minus: Zoom Out
    else if ((event.ctrlKey || event.metaKey) && event.key === '-') {
      event.preventDefault();
      zoomOut();
    }
    // Ctrl/Cmd + 0: Reset Zoom
    else if ((event.ctrlKey || event.metaKey) && event.key === '0') {
      event.preventDefault();
      setZoom(100);
    }
    // F5: Refresh
    else if (event.key === 'F5') {
      event.preventDefault();
      refresh();
    }
    // Ctrl/Cmd + P: Print
    else if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
      event.preventDefault();
      print();
    }
  }

  /**
   * Zoom in to next level
   */
  function zoomIn() {
    const currentIndex = ZOOM_LEVELS.indexOf(currentZoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIndex + 1]);
    }
  }

  /**
   * Zoom out to previous level
   */
  function zoomOut() {
    const currentIndex = ZOOM_LEVELS.indexOf(currentZoom);
    if (currentIndex > 0) {
      setZoom(ZOOM_LEVELS[currentIndex - 1]);
    }
  }

  /**
   * Set zoom level
   */
  function setZoom(percent) {
    // Clamp to valid zoom levels
    const validZoom = ZOOM_LEVELS.reduce((prev, curr) => {
      return Math.abs(curr - percent) < Math.abs(prev - percent) ? curr : prev;
    });

    currentZoom = validZoom;
    zoomLevel.textContent = `${currentZoom}%`;

    // Apply zoom to preview content
    const previewContent = previewContainer.querySelector('.preview-content');
    if (previewContent) {
      // Remove all zoom classes
      ZOOM_LEVELS.forEach(level => {
        previewContent.classList.remove(`zoom-${level}`);
      });
      // Add current zoom class
      previewContent.classList.add(`zoom-${currentZoom}`);
    }

    // Notify extension
    vscode.postMessage({
      type: 'zoom',
      value: currentZoom
    });
  }

  /**
   * Update page info display
   */
  function updatePageInfo() {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  /**
   * Refresh preview
   */
  function refresh() {
    vscode.postMessage({ type: 'refresh' });
  }

  /**
   * Trigger print
   */
  function print() {
    vscode.postMessage({ type: 'print' });
  }

  /**
   * Trigger PDF export
   */
  function exportPdf() {
    vscode.postMessage({ type: 'exportPdf' });
  }

  /**
   * Handle messages from extension
   */
  window.addEventListener('message', event => {
    const message = event.data;

    switch (message.type) {
      case 'update':
        // Update preview content
        updatePreview(message.html, message.pageCount);
        break;

      case 'error':
        // Show error message
        showError(message.message);
        break;
    }
  });

  /**
   * Update preview content
   */
  function updatePreview(html, pageCount) {
    // Wrap content in preview-content div for styling
    const wrappedHtml = `<div class="preview-content zoom-${currentZoom}">${html}</div>`;
    previewContainer.innerHTML = wrappedHtml;

    // Update page count
    totalPages = pageCount || 1;
    currentPage = 1;
    updatePageInfo();
  }

  /**
   * Show error message
   */
  function showError(message) {
    previewContainer.innerHTML = `
      <div class="error-state">
        <div>⚠ Error</div>
        <div>${escapeHtml(message)}</div>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
