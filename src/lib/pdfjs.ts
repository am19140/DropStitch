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

/**
 * pdf.js loops over streams with `for await`, which Safari only supports from version 26. Older
 * iPhones fail with "undefined is not a function (near '...t of e...')" unless streams get it here.
 */
const STREAM_ITERATION = `
  if (typeof ReadableStream !== 'undefined' && !ReadableStream.prototype[Symbol.asyncIterator]) {
    ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
      const reader = this.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    };
  }
`;

/** Page-side code defining `async function loadPdfjs()`, which returns the pdf.js module. */
export const LOAD_PDFJS = `
  async function loadPdfjs() {
    ${STREAM_ITERATION}
    const code = window.__PDFJS_CODE__;
    const url = (text) => URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
    const pdfjs = await import(url(code.lib));
    pdfjs.GlobalWorkerOptions.workerSrc = url(${JSON.stringify(STREAM_ITERATION)} + code.worker);
    return pdfjs;
  }
`;
