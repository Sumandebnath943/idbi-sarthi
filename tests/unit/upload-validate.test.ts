import { test, expect, describe } from "bun:test";
import { validateUpload, sniffKind, type FileKind } from "@/lib/upload-validate";

const ALLOW: FileKind[] = ["pdf", "png", "jpeg", "webp"];
const bytes = (arr: number[]) => new Uint8Array(arr);

describe("magic-byte sniffing", () => {
  test("detects PDF/PNG/JPEG/WEBP", () => {
    expect(sniffKind(bytes([0x25, 0x50, 0x44, 0x46]))).toBe("pdf");
    expect(sniffKind(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    expect(sniffKind(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(sniffKind(bytes([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("webp");
  });
  test("returns null for unknown/binary", () => {
    expect(sniffKind(bytes([0x4d, 0x5a, 0x90, 0x00]))).toBeNull(); // MZ (exe)
  });
});

describe("validateUpload allowlist", () => {
  test("accepts allowed image/pdf types", () => {
    expect(validateUpload(bytes([0x25, 0x50, 0x44, 0x46]), ALLOW, true)).toMatchObject({ ok: true, kind: "pdf" });
  });

  test("rejects a real binary (exe) with 415", () => {
    const r = validateUpload(bytes([0x4d, 0x5a, 0x90, 0x00, 0x03]), ALLOW, false);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(415);
  });

  test("rejects binary with NUL even when text is allowed", () => {
    const r = validateUpload(bytes([0x4d, 0x5a, 0x00, 0x03, 0x04]), ALLOW, true);
    expect(r.ok).toBe(false);
  });

  test("accepts plain text only when allowText is true", () => {
    const t = bytes([...Buffer.from("This is a plain policy document.")]);
    expect(validateUpload(t, ALLOW, true)).toMatchObject({ ok: true, kind: "text" });
    expect(validateUpload(t, ALLOW, false).ok).toBe(false);
  });
});
