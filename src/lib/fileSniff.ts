/**
 * Identifies an uploaded file from its first bytes ("magic numbers") instead
 * of trusting its name or the browser-supplied MIME type, both of which the
 * uploader controls.
 */

export type SniffedFile =
  | { kind: "png"; mime: "image/png"; ext: "png" }
  | { kind: "jpeg"; mime: "image/jpeg"; ext: "jpg" }
  | { kind: "webp"; mime: "image/webp"; ext: "webp" }
  | { kind: "pdf"; mime: "application/pdf"; ext: "pdf" };

export type SniffedKind = SniffedFile["kind"];

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((b, i) => bytes[offset + i] === b);
}

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

export function sniffFileType(bytes: Uint8Array): SniffedFile | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { kind: "png", mime: "image/png", ext: "png" };
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { kind: "jpeg", mime: "image/jpeg", ext: "jpg" };
  }
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) {
    return { kind: "webp", mime: "image/webp", ext: "webp" };
  }
  if (startsWith(bytes, ascii("%PDF-"))) {
    return { kind: "pdf", mime: "application/pdf", ext: "pdf" };
  }
  return null;
}

const EXTENSIONS: Record<SniffedKind, string[]> = {
  png: ["png"],
  jpeg: ["jpg", "jpeg"],
  webp: ["webp"],
  pdf: ["pdf"],
};

/** The file name's extension must agree with what the bytes say it is. */
export function extensionMatches(filename: string, sniffed: SniffedFile): boolean {
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return !!ext && EXTENSIONS[sniffed.kind].includes(ext);
}

/** Keeps an uploaded file's name safe to store and show: no paths or control characters, 200 chars max. */
export function cleanFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return (cleaned || "file").slice(0, 200);
}

export type UploadCheck =
  | { ok: true; bytes: Uint8Array; sniffed: SniffedFile; filename: string }
  | { ok: false; error: string };

/** Size, content-type and extension checks shared by every private upload. */
export async function checkUpload(
  file: unknown,
  opts: { maxBytes: number; allowed: SniffedKind[]; label: string },
): Promise<UploadCheck> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file to upload." };
  const mb = Math.round(opts.maxBytes / 1024 / 1024);
  if (file.size > opts.maxBytes) return { ok: false, error: `That file is too big. The limit is ${mb} MB.` };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffFileType(bytes);
  const filename = cleanFilename(file.name);
  if (!sniffed || !opts.allowed.includes(sniffed.kind) || !extensionMatches(filename, sniffed)) {
    return { ok: false, error: `That file type isn't supported. Use ${opts.label}.` };
  }
  return { ok: true, bytes, sniffed, filename };
}
