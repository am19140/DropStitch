import { useEffect, useRef } from 'react';

import type { HtmlViewProps } from './html-view';

/** Web stand-in for the native WebView: a sandboxed iframe that posts messages to its parent. */
export function HtmlView({ html, onMessage, backgroundColor }: HtmlViewProps) {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow && typeof event.data === 'string') {
        onMessage(event.data);
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onMessage]);

  return (
    <iframe
      ref={frame}
      title="Pattern"
      srcDoc={html}
      sandbox="allow-scripts"
      style={{ flex: 1, border: 0, width: '100%', height: '100%', backgroundColor }}
    />
  );
}
