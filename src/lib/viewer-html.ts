/**
 * Builds the self-contained HTML page used to show a pattern's files (images and PDFs)
 * inside a WebView (native) or iframe (web). PDFs are drawn with pdf.js from a CDN, which
 * works the same on iOS and Android — Android's WebView can't display PDFs by itself.
 *
 * The page also has a "row marker": a highlight bar the knitter taps or drags to keep
 * their place. Its position and the scroll position are reported back with postMessage
 * so they can be restored next time.
 */

const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/legacy/build';

export type ViewerFile = { kind: 'pdf' | 'image'; mimeType: string; base64: string };

export type ViewerColors = {
  background: string;
  text: string;
  textSecondary: string;
  primary: string;
};

export type ViewerMessage =
  | { type: 'marker'; y: number }
  | { type: 'scroll'; y: number }
  | { type: 'error'; message: string };

export function buildViewerHtml(
  files: ViewerFile[],
  colors: ViewerColors,
  initial: { markerY?: number; scrollY?: number }
) {
  // JSON.stringify keeps the data safe to embed; "<" is escaped so nothing can close the tag.
  const data = JSON.stringify({ files, initial }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=6, user-scalable=yes">
<style>
  html, body { margin: 0; padding: 0; background: ${colors.background}; color: ${colors.text};
    font: 15px -apple-system, system-ui, Roboto, sans-serif; -webkit-user-select: none; user-select: none; }
  #doc { position: relative; padding: 8px 0 120px; }
  .page { display: block; width: 100%; height: auto; margin: 0 0 8px; background: #fff; }
  .note { padding: 10px 16px; color: ${colors.textSecondary}; text-align: center; font-size: 13px; }
  .error { padding: 24px 16px; text-align: center; }
  #marker { position: absolute; left: 0; right: 0; height: 30px; margin-top: -15px; display: none;
    background: ${colors.primary}33; border-top: 2px solid ${colors.primary};
    border-bottom: 2px solid ${colors.primary}; touch-action: none; }
  #marker::after { content: ''; position: absolute; right: 6px; top: 50%; width: 22px; height: 22px;
    margin-top: -11px; border-radius: 50%; background: ${colors.primary}; }
</style>
</head>
<body>
<div id="doc">
  <div class="note">Tap the pattern to place a row marker. Drag it to move.</div>
  <div id="pages"></div>
  <div id="marker" role="presentation"></div>
</div>
<script>window.__VIEWER__ = ${data};</script>
<script type="module">
  const { files, initial } = window.__VIEWER__;
  const doc = document.getElementById('doc');
  const pagesEl = document.getElementById('pages');
  const marker = document.getElementById('marker');

  const post = (msg) => {
    const text = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else window.parent.postMessage(text, '*');
  };

  function setMarker(y, report) {
    const max = doc.scrollHeight;
    y = Math.max(0, Math.min(max, y));
    marker.style.top = y + 'px';
    marker.style.display = 'block';
    if (report) post({ type: 'marker', y: Math.round(y) });
  }

  // Tap anywhere on the pattern to move the marker there.
  let start = null;
  doc.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; });
  doc.addEventListener('pointerup', (e) => {
    if (!start || e.target === marker) return;
    const moved = Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y);
    start = null;
    if (moved < 10) setMarker(e.pageY - doc.offsetTop, true);
  });

  // Drag the marker itself.
  let dragOffset = null;
  marker.addEventListener('pointerdown', (e) => {
    dragOffset = e.pageY - marker.offsetTop;
    marker.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  marker.addEventListener('pointermove', (e) => {
    if (dragOffset !== null) setMarker(e.pageY - dragOffset, false);
  });
  marker.addEventListener('pointerup', () => {
    if (dragOffset === null) return;
    dragOffset = null;
    post({ type: 'marker', y: Math.round(marker.offsetTop) });
  });

  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => post({ type: 'scroll', y: Math.round(window.scrollY) }), 400);
  });

  function toBytes(base64) {
    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  function showError(message) {
    const el = document.createElement('div');
    el.className = 'error';
    el.textContent = message;
    pagesEl.appendChild(el);
    post({ type: 'error', message });
  }

  let pdfjs;
  async function renderPdf(file) {
    if (!pdfjs) {
      pdfjs = await import('${PDFJS}/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = '${PDFJS}/pdf.worker.min.mjs';
    }
    const pdf = await pdfjs.getDocument({ data: toBytes(file.base64), isEvalSupported: false }).promise;
    const width = pagesEl.clientWidth || window.innerWidth;
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const base = page.getViewport({ scale: 1 });
      // Render sharper than the screen so pinch-zoom stays readable.
      const viewport = page.getViewport({ scale: (width / base.width) * ratio * 1.5 });
      const canvas = document.createElement('canvas');
      canvas.className = 'page';
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      pagesEl.appendChild(canvas);
      await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
    }
  }

  async function renderImage(file) {
    const img = document.createElement('img');
    img.className = 'page';
    img.alt = '';
    img.src = 'data:' + file.mimeType + ';base64,' + file.base64;
    pagesEl.appendChild(img);
    await img.decode().catch(() => {});
  }

  (async () => {
    for (const file of files) {
      try {
        if (file.kind === 'pdf') await renderPdf(file);
        else await renderImage(file);
      } catch (err) {
        showError(file.kind === 'pdf'
          ? 'Could not open this PDF. PDFs need an internet connection the first time they are shown.'
          : 'Could not show this image.');
      }
    }
    if (typeof initial.markerY === 'number') setMarker(initial.markerY, false);
    if (typeof initial.scrollY === 'number') window.scrollTo(0, initial.scrollY);
  })();
</script>
</body>
</html>`;
}
