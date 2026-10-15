import { useEffect } from 'react';
import { Platform } from 'react-native';

// The exported app's bundle in the page, e.g. /_expo/static/js/web/entry-8939e1f7….js
const ENTRY = /\/_expo\/static\/js\/web\/entry-[a-f0-9]+\.js/;
// Screens where a reload would lose something being typed (or a sign-up waiting for its email link).
const TYPING = /^\/(login|new|account|yarn\/new|project\/[^/]+\/edit)(\/|$)/;
// At most one look per minute, however often the app is switched to.
const EVERY_MS = 60_000;

function loadedBuild() {
  for (const script of Array.from(document.scripts)) {
    const match = script.src.match(ENTRY);
    if (match) return match[0];
  }
  return null;
}

/**
 * The web app (like the test copy on a phone's home screen) can stay open for days and would keep
 * running the version it first loaded. Whenever it comes back into view, ask the server which build
 * is current, and reload into a newer one. Saved knitting lives on the phone, so nothing is lost.
 */
export function useWebUpdates() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const loaded = loadedBuild();
    // Only an exported build has one to compare; the dev server reloads by itself.
    if (!loaded) return;
    let lastLook = Date.now();
    let looking = false;

    const look = async () => {
      if (looking || document.visibilityState !== 'visible' || Date.now() - lastLook < EVERY_MS) return;
      if (TYPING.test(window.location.pathname)) return;
      looking = true;
      lastLook = Date.now();
      try {
        const page = await (await fetch('/', { cache: 'no-store' })).text();
        const current = page.match(ENTRY)?.[0];
        if (current && current !== loaded) window.location.reload();
      } catch {
        // Offline: carry on with the version that's here.
      } finally {
        looking = false;
      }
    };

    document.addEventListener('visibilitychange', look);
    window.addEventListener('focus', look);
    return () => {
      document.removeEventListener('visibilitychange', look);
      window.removeEventListener('focus', look);
    };
  }, []);
}
