/**
 * The pattern bench: reads real pattern PDFs the way the app does and shows what the reader made of
 * them, so mistakes can be found and fixed. The PDFs stay where they are (they're the designers'
 * work: never add them to the repo).
 *
 *   npm run bench -- "C:\Users\me\Downloads\patterns"          every PDF (and .txt) in a folder
 *   npm run bench -- pattern.pdf --size M                       one file, steps for size M
 *   npm run bench -- folder --out report.txt                    also write the report to a file
 *
 * For each pattern it lists the sizes, the steps for one size (the middle one unless --size says),
 * steps the reader wasn't sure about (marked "?"), and lines of the pattern that don't show up in
 * any step: front matter it skipped on purpose, or instructions it lost.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, extname, join } from 'node:path';

const { PDF_LINES_JS, PAGE_BREAK } = await import('../src/lib/pdf-lines.ts');
const { parsePattern } = await import('../src/lib/pattern-parser.ts');
const { lengthTarget } = await import('../src/lib/step-rules.ts');
const pdfPageLines = new Function(`${PDF_LINES_JS}\nreturn pdfPageLines;`)();

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args.splice(i, 2)[1];
};
const sizeWanted = option('--size');
const outFile = option('--out');
const targets = args.length ? args : [join(homedir(), 'Downloads', 'patterns')];

const files = targets.flatMap((t) =>
  statSync(t).isDirectory()
    ? readdirSync(t)
        .filter((f) => /\.(pdf|txt)$/i.test(f))
        .sort()
        .map((f) => join(t, f))
    : [t]
);

async function pdfText(path) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdf = await getDocument({ data: new Uint8Array(readFileSync(path)), isEvalSupported: false }).promise;
  const pages = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const content = await (await pdf.getPage(n)).getTextContent();
    pages.push(pdfPageLines(content.items).join('\n'));
  }
  return pages.join(PAGE_BREAK);
}

/** The letters-only words of a line, to find it again in the steps whatever size was picked. */
const words = (s) => s.toLowerCase().match(/[a-z]+/g) ?? [];

const out = [];
const log = (line = '') => out.push(line);
let totalSteps = 0;
let totalUnsure = 0;
let totalMissing = 0;

for (const file of files) {
  const text = extname(file).toLowerCase() === '.pdf' ? await pdfText(file) : readFileSync(file, 'utf8');
  const pattern = parsePattern(text);
  const { sizes } = pattern;
  let index = sizes.length ? Math.floor((sizes.length - 1) / 2) : 0;
  if (sizeWanted && sizes.length) {
    const byLabel = sizes.findIndex((s) => s.toLowerCase() === sizeWanted.toLowerCase());
    index = byLabel !== -1 ? byLabel : Math.min(Number(sizeWanted) || 0, sizes.length - 1);
  }
  const steps = pattern.stepsFor(index);
  const unsure = steps.filter((s) => s.unsure).length;
  totalSteps += steps.length;
  totalUnsure += unsure;

  log(`${'='.repeat(100)}`);
  log(`${basename(file)}  ·  ${text.split('\f').length} pages  ·  ${pattern.craft}`);
  log(sizes.length ? `sizes: ${sizes.join(' / ')}  →  showing ${sizes[index]}` : 'one size');
  if (sizes.length > 1) log(`steps per size: ${sizes.map((s, i) => `${s} ${pattern.stepsFor(i).length}`).join(', ')}`);
  log(`${steps.length} steps, ${unsure} unsure, ${steps.filter((s) => s.rows).length} with a row count`);
  log();
  let section;
  steps.forEach((s, i) => {
    if (s.section !== section) {
      section = s.section;
      log(`  — ${section ?? '(no heading)'}`);
    }
    const tags = [
      s.rows ? `${s.rows} ${s.inRound ? 'rnds' : 'rows'}` : '',
      s.startSide ?? (s.inRound ? 'round' : ''),
      s.stitches ? `${s.stitches} sts` : '',
      lengthTarget(s.text) ? `Reached ${lengthTarget(s.text)}` : '',
    ].filter(Boolean);
    log(`  ${s.unsure ? '?' : ' '}${String(i + 1).padStart(3)}. ${s.text}${tags.length ? `   {${tags.join(', ')}}` : ''}`);
    for (const l of s.lines ?? []) log(`          · ${l}`);
  });

  // Lines that don't show up in any step (text, rows or full pattern text).
  const shown = ` ${steps.map((s) => words([s.text, s.detail ?? '', ...(s.lines ?? [])].join(' ')).join(' ')).join(' ')} `;
  const missing = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => {
      const w = words(l);
      return w.length >= 3 && !shown.includes(` ${w.slice(0, 4).join(' ')} `);
    });
  totalMissing += missing.length;
  if (missing.length) {
    log();
    log(`  Not in any step (${missing.length} lines; front matter is fine, instructions are not):`);
    for (const l of missing) log(`      ${l.length > 110 ? `${l.slice(0, 107)}…` : l}`);
  }
  log();
}

log(`${files.length} patterns · ${totalSteps} steps · ${totalUnsure} unsure · ${totalMissing} lines not in any step`);
const report = out.join('\n');
console.log(report);
if (outFile) writeFileSync(outFile, report);
