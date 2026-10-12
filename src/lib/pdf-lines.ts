/**
 * How the text of a PDF page is put back together into lines, as JavaScript source. It runs inside
 * the PDF text reader's web page (see pdf-text-reader.tsx) and in scripts/pattern-bench.mjs, so the
 * app and the bench read every PDF exactly the same way.
 *
 * `pdfPageLines(items)` takes pdf.js text items and returns the page's lines. Pages are joined with
 * a form feed (PAGE_BREAK), so the pattern reader can tell page headers and footers apart.
 */
export const PDF_LINES_JS = `
function pdfPageLines(items) {
  var line = '', lastY = null, out = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var y = item.transform ? Math.round(item.transform[5]) : lastY;
    if (lastY !== null && y !== null && Math.abs(y - lastY) > 2 && line) { out.push(line); line = ''; }
    line += item.str;
    if (item.hasEOL) { out.push(line); line = ''; }
    lastY = y;
  }
  if (line) out.push(line);
  return out;
}`;

/** Between pages in the text handed to the pattern reader. */
export const PAGE_BREAK = '\n\f\n';
