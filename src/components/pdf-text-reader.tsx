import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HtmlView } from '@/components/html-view';
import { readPatternFile } from '@/lib/pattern-files';
import { PDFJS } from '@/lib/viewer-html';
import type { PatternFile } from '@/store/projects';

/** A tiny page that loads pdf.js, pulls the text out of a PDF line by line, and posts it back. */
function extractorHtml(base64: string) {
  const data = JSON.stringify(base64);
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script type="module">
  const post = (msg) => {
    const text = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else window.parent.postMessage(text, '*');
  };
  try {
    const pdfjs = await import('${PDFJS}/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = '${PDFJS}/pdf.worker.min.mjs';
    const raw = atob(${data});
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
    const pages = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const content = await (await pdf.getPage(n)).getTextContent();
      let line = '', lastY = null, out = [];
      for (const item of content.items) {
        const y = item.transform ? Math.round(item.transform[5]) : lastY;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2 && line) { out.push(line); line = ''; }
        line += item.str;
        if (item.hasEOL) { out.push(line); line = ''; }
        lastY = y;
      }
      if (line) out.push(line);
      pages.push(out.join('\\n'));
    }
    post({ type: 'pdf-text', text: pages.join('\\n\\n') });
  } catch (e) {
    post({ type: 'pdf-text-error', message: String(e && e.message || e) });
  }
</script></body></html>`;
}

type PdfTextReaderProps = {
  file: PatternFile;
  onText: (text: string) => void;
  onError: () => void;
};

/** Invisible helper: reads the text of a PDF pattern and hands it back. */
export function PdfTextReader({ file, onText, onError }: PdfTextReaderProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    readPatternFile(file)
      .then((base64) => !cancelled && setHtml(extractorHtml(base64)))
      .catch(() => !cancelled && onError());
    return () => {
      cancelled = true;
    };
    // Only re-read when a different file is passed in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id]);

  if (!html) return null;
  return (
    <View style={styles.hidden} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <HtmlView
        html={html}
        backgroundColor="transparent"
        onMessage={(data) => {
          try {
            const msg = JSON.parse(data);
            if (msg.type === 'pdf-text') onText(msg.text);
            else if (msg.type === 'pdf-text-error') onError();
          } catch {
            // Not one of ours.
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
});
