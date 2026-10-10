"use client";

import type { ParsedDocument, ParsedPage, ParsedTable } from "@/core/ingest/types";

/**
 * Browser-side parsing for "Import Everything" (COP-DI-03 P0). Files are read locally — nothing
 * is uploaded. PDF (text layer, with Thai+English OCR on demand for scans), DOCX, XLSX, CSV,
 * JPG/PNG (EXIF date and GPS — never invented), ZIP archives and whole folders.
 */

export interface InputFile { file: Blob; name: string; path: string }

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
export async function sha256(buf: ArrayBuffer): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", buf));
}

const extOf = (name: string) => name.toLowerCase().split(".").pop() ?? "";
const mimeOf = (name: string, fallback = "") => ({ pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xls: "application/vnd.ms-excel", csv: "text/csv", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", zip: "application/zip", txt: "text/plain", md: "text/markdown" } as Record<string, string>)[extOf(name)] ?? fallback;

/** Expand ZIP archives (recursively) and keep folder paths. */
export async function expand(inputs: InputFile[]): Promise<InputFile[]> {
  const out: InputFile[] = [];
  for (const f of inputs) {
    if (extOf(f.name) !== "zip") { out.push(f); continue; }
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(await f.file.arrayBuffer());
    const inner: InputFile[] = [];
    for (const entry of Object.values(zip.files)) {
      if (entry.dir || /(^|\/)(__MACOSX|\.DS_Store)/.test(entry.name)) continue;
      inner.push({ file: new Blob([await entry.async("arraybuffer")], { type: mimeOf(entry.name) }), name: entry.name.split("/").pop()!, path: `${f.path}/${entry.name}` });
    }
    out.push(...(await expand(inner)));
  }
  return out;
}

/** Walk a dropped folder (DataTransferItem.webkitGetAsEntry). */
export async function filesFromDrop(items: DataTransferItemList): Promise<InputFile[]> {
  const out: InputFile[] = [];
  type Entry = { isFile: boolean; isDirectory: boolean; name: string; fullPath: string; file?: (cb: (f: File) => void, err: (e: unknown) => void) => void; createReader?: () => { readEntries: (cb: (e: Entry[]) => void, err: (e: unknown) => void) => void } };
  const walk = async (e: Entry): Promise<void> => {
    if (e.isFile && e.file) {
      const f = await new Promise<File>((res, rej) => e.file!(res, rej));
      out.push({ file: f, name: f.name, path: e.fullPath.replace(/^\//, "") });
    } else if (e.isDirectory && e.createReader) {
      const reader = e.createReader();
      let batch: Entry[];
      do {
        batch = await new Promise<Entry[]>((res, rej) => reader.readEntries(res, rej));
        for (const c of batch) await walk(c);
      } while (batch.length);
    }
  };
  const entries = Array.from(items).map((i) => (i as DataTransferItem & { webkitGetAsEntry?: () => Entry | null }).webkitGetAsEntry?.()).filter(Boolean) as Entry[];
  if (entries.length) for (const e of entries) await walk(e);
  else for (const i of Array.from(items)) { const f = i.getAsFile(); if (f) out.push({ file: f, name: f.name, path: f.name }); }
  return out;
}

export const filesFromInput = (list: FileList): InputFile[] =>
  Array.from(list).map((f) => ({ file: f, name: f.name, path: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name }));

/* ───────── PDF ───────── */

type PdfJs = typeof import("pdfjs-dist");
let pdfjsP: Promise<PdfJs> | null = null;
const pdfjs = () => (pdfjsP ??= import("pdfjs-dist").then((m) => { m.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs"; return m; }));

async function parsePdf(buf: ArrayBuffer, ocr: boolean, onProgress?: (msg: string) => void): Promise<{ pages: ParsedPage[]; errors: string[] }> {
  const lib = await pdfjs();
  const doc = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
  const pages: ParsedPage[] = [];
  const errors: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const tc = await page.getTextContent();
    let lastY: number | null = null;
    let text = "";
    for (const it of tc.items as { str?: string; transform?: number[] }[]) {
      if (typeof it.str !== "string" || !it.transform) continue;
      const y = it.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) text += Math.abs(y - lastY) > 18 ? "\n\n" : "\n";
      text += it.str;
      lastY = y;
    }
    if (ocr && text.replace(/\s+/g, "").length < 20) {
      onProgress?.(`OCR หน้า ${n}/${doc.numPages}`);
      try {
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
        pages.push({ page: n, text: await ocrImage(canvas), ocr: true });
        continue;
      } catch (e) { errors.push(`OCR p.${n}: ${(e as Error).message}`); }
    }
    pages.push({ page: n, text });
  }
  return { pages, errors };
}

/* ───────── OCR (tesseract.js, Thai + English, loaded on demand) ───────── */
type TessWorker = { recognize: (img: HTMLCanvasElement | Blob) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> };
let workerP: Promise<TessWorker> | null = null;
async function ocrImage(img: HTMLCanvasElement | Blob): Promise<string> {
  workerP ??= import("tesseract.js").then((m) => m.createWorker(["tha", "eng"]) as unknown as Promise<TessWorker>);
  const w = await workerP;
  const r = await w.recognize(img);
  return r.data.text;
}

/* ───────── Spreadsheets, DOCX, images ───────── */

async function parseSheet(buf: ArrayBuffer): Promise<ParsedTable[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(new Uint8Array(buf), { type: "array", cellDates: false });
  return wb.SheetNames.map((name) => ({ sheet: name, rows: XLSX.utils.sheet_to_json<(string | number | null)[]>(wb.Sheets[name], { header: 1, raw: true, defval: null }) }));
}

async function parseDocx(buf: ArrayBuffer): Promise<string> {
  const mammoth = (await import("mammoth/mammoth.browser.min.js")).default;
  return (await mammoth.extractRawText({ arrayBuffer: buf })).value;
}

async function parseImage(blob: Blob): Promise<ParsedDocument["image"]> {
  const exifr = (await import("exifr")).default;
  let takenAt: string | undefined;
  let gps: { lat: number; lon: number } | undefined;
  try {
    const meta = await exifr.parse(blob, { gps: true, pick: ["DateTimeOriginal", "CreateDate", "latitude", "longitude"] });
    const d = meta?.DateTimeOriginal ?? meta?.CreateDate;
    if (d instanceof Date && !isNaN(d.getTime())) takenAt = d.toISOString();
    if (typeof meta?.latitude === "number" && typeof meta?.longitude === "number") gps = { lat: meta.latitude, lon: meta.longitude };
  } catch { /* no EXIF → unknown, never generated */ }
  let width: number | undefined, height: number | undefined;
  try { const bmp = await createImageBitmap(blob); width = bmp.width; height = bmp.height; bmp.close(); } catch { /* ignore */ }
  return { takenAt, gps, width, height };
}

export interface ParseOptions { ocr: boolean; sourceConnectionId: string; onProgress?: (path: string, msg: string) => void }

export async function parseFile(f: InputFile, o: ParseOptions): Promise<ParsedDocument> {
  const buf = await f.file.arrayBuffer();
  const ext = extOf(f.name);
  const base: ParsedDocument = { fileName: f.name, path: f.path, mime: mimeOf(f.name, f.file.type || "application/octet-stream"), size: buf.byteLength, sha256: await sha256(buf), pages: [], tables: [], parseErrors: [], sourceConnectionId: o.sourceConnectionId };
  try {
    if (ext === "pdf") {
      const r = await parsePdf(buf, o.ocr, (m) => o.onProgress?.(f.path, m));
      base.pages = r.pages;
      base.parseErrors.push(...r.errors);
    } else if (ext === "docx") base.pages = [{ page: 1, text: await parseDocx(buf) }];
    else if (ext === "xlsx" || ext === "xls" || ext === "csv") base.tables = await parseSheet(buf);
    else if (ext === "jpg" || ext === "jpeg" || ext === "png") {
      base.image = await parseImage(f.file);
      if (o.ocr) { o.onProgress?.(f.path, "OCR"); base.pages = [{ page: 1, text: await ocrImage(f.file), ocr: true }]; }
    } else if (ext === "txt" || ext === "md") base.pages = [{ page: 1, text: new TextDecoder().decode(buf) }];
    else base.parseErrors.push(`unsupported file type .${ext}`);
  } catch (e) {
    base.parseErrors.push((e as Error).message || "unreadable or corrupt file");
  }
  return base;
}
