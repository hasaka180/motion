import { cp, mkdir } from 'node:fs/promises';
const target = new URL('../public/vendor/pdfjs/', import.meta.url);
const source = new URL('../node_modules/pdfjs-dist/', import.meta.url);
await mkdir(target, { recursive: true });
for (const item of ['build/pdf.worker.min.mjs', 'cmaps', 'standard_fonts', 'wasm']) {
  await cp(new URL(item, source), new URL(item === 'build/pdf.worker.min.mjs' ? 'pdf.worker.min.mjs' : item, target), { recursive: true });
}
