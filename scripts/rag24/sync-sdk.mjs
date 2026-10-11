/**
 * Copies the RAG24 TypeScript SDK into COP24 (src/lib/rag24/sdk). The SDK is not published to npm and
 * a local file dependency would break the Vercel build, so COP24 vendors it.
 *   npm run rag24:sync-sdk            (RAG24 checkout at ../RAG24 Reuse)
 *   RAG24_REPO=path npm run rag24:sync-sdk
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const repo = resolve(process.env.RAG24_REPO ?? join(ROOT, "../RAG24 Reuse"));
let rev = "unknown";
try { rev = execSync("git rev-parse --short HEAD", { cwd: repo }).toString().trim(); } catch {}
for (const f of ["index.ts", "integration.ts"]) {
  const src = readFileSync(join(repo, "sdk/typescript/src", f), "utf8");
  const head = `/* Vendored from RAG24 (github.com/classichot/RAG24) sdk/typescript/src/${f} @ ${rev}. Do not edit here — change RAG24, then run npm run rag24:sync-sdk. */\n`;
  // the SDK is written for Node ESM ("./x.js"); the Next bundler resolves extensionless TypeScript imports
  writeFileSync(join(ROOT, "src/lib/rag24/sdk", f), head + src.replace(/from "\.\/(index|integration)\.js"/g, 'from "./$1"'));
}
console.log(`synced RAG24 SDK @ ${rev} from ${repo}`);
