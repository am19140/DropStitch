/**
 * Lets Node run the app's TypeScript helpers directly (for `npm test` and the pattern bench):
 * resolves "@/…" to src/ and finds .ts files for imports written without an extension.
 *
 *   node --import ./scripts/ts-hooks.mjs some-script.mjs
 */
import { existsSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const src = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function withExtension(path) {
  for (const candidate of [path, `${path}.ts`, `${path}.tsx`, join(path, 'index.ts')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return pathToFileURL(candidate).href;
  }
  return undefined;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const url = withExtension(join(src, specifier.slice(2)));
      if (url) return nextResolve(url, context);
    } else if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith('file:')) {
      const url = withExtension(fileURLToPath(new URL(specifier, context.parentURL)));
      if (url) return nextResolve(url, context);
    }
    return nextResolve(specifier, context);
  },
});
