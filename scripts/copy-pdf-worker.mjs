// Copies the pdf.js worker into public/ so the browser can load it from our own origin.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const src = join(dirname(require.resolve("pdfjs-dist/package.json")), "build", "pdf.worker.min.mjs");
mkdirSync("public/vendor", { recursive: true });
copyFileSync(src, "public/vendor/pdf.worker.min.mjs");
console.log("pdf.worker.min.mjs → public/vendor/");
