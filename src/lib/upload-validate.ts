// Upload validation: verify a file's real type by its magic bytes (not the
// client-supplied MIME/name), enforce a strict allowlist, and sanitize images.
//
// Node runtime only (uses sharp for image re-encoding / EXIF stripping).

export type FileKind = "pdf" | "png" | "jpeg" | "webp" | "text";

export type UploadCheck =
  | { ok: true; kind: FileKind }
  | { ok: false; error: string; status: number };

function isProbablyText(buf: Uint8Array): boolean {
  // Reject binary: sample the first 512 bytes; require mostly printable/UTF-8.
  const n = Math.min(buf.length, 512);
  if (n === 0) return false;
  let control = 0;
  for (let i = 0; i < n; i++) {
    const b = buf[i];
    if (b === 0) return false; // NUL -> binary
    if (b < 9 || (b > 13 && b < 32)) control++;
  }
  return control / n < 0.1;
}

/** Detect the real file kind from magic bytes. Returns null if unrecognized. */
export function sniffKind(buf: Uint8Array): Exclude<FileKind, "text"> | null {
  const b = buf;
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "pdf"; // %PDF
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // WEBP
  ) {
    return "webp";
  }
  return null;
}

/**
 * Validate an upload against an allowlist using its actual bytes.
 * @param allow      allowed kinds (e.g. ["pdf","png","jpeg","webp"])
 * @param allowText  also accept plain UTF-8 text (no magic bytes)
 */
export function validateUpload(buf: Uint8Array, allow: FileKind[], allowText: boolean): UploadCheck {
  const sniffed = sniffKind(buf);
  if (sniffed) {
    if (!allow.includes(sniffed)) {
      return { ok: false, error: `File type '${sniffed}' is not permitted here.`, status: 415 };
    }
    return { ok: true, kind: sniffed };
  }
  if (allowText && isProbablyText(buf)) return { ok: true, kind: "text" };
  return { ok: false, error: "Unsupported or unrecognized file type.", status: 415 };
}

/**
 * Re-encode an image to strip EXIF/metadata (GPS, device info) and cap
 * dimensions, mitigating decompression-bomb / metadata-leak risks.
 */
export async function sanitizeImage(buf: ArrayBuffer, kind: FileKind): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  let pipeline = sharp(Buffer.from(buf), { limitInputPixels: 40_000_000 })
    .rotate() // apply EXIF orientation, then drop metadata
    .resize({ width: 4000, height: 4000, fit: "inside", withoutEnlargement: true });
  if (kind === "png") pipeline = pipeline.png();
  else if (kind === "webp") pipeline = pipeline.webp();
  else pipeline = pipeline.jpeg({ quality: 90 });
  return pipeline.toBuffer();
}
