/**
 * pdf.js ships inside the app (see scripts/bundle-pdfjs.mjs), so patterns open and get read
 * without an internet connection. The generated pages carry its code in a <script> tag and load it
 * from a blob: URL — the same on iOS, Android and the web.
 */
import { PDFJS_LIB, PDFJS_WORKER } from '@/lib/pdfjs.generated';

/** A <script> that puts pdf.js's code on the page, for `loadPdfjs()` (in the page) to import. */
export function pdfjsScript() {
  // "<" is escaped so nothing in the code can close the tag.
  const code = JSON.stringify({ lib: PDFJS_LIB, worker: PDFJS_WORKER }).replace(/</g, '\\u003c');
  return `<script>window.__PDFJS_CODE__ = ${code};</script>`;
}

/** Page-side code defining `async function loadPdfjs()`, which returns the pdf.js module. */
export const LOAD_PDFJS = `
  async function loadPdfjs() {
    const code = window.__PDFJS_CODE__;
    const url = (text) => URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
    const pdfjs = await import(url(code.lib));
    pdfjs.GlobalWorkerOptions.workerSrc = url(code.worker);
    return pdfjs;
  }
`;
