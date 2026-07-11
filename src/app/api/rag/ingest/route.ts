import { NextResponse } from "next/server";
import { ensureSeeded, ingestDocument } from "@/lib/ingest";
import { vectorStore } from "@/lib/vectors";
import { requireRole } from "@/lib/auth-guard";
import { audit, clientIpFromHeaders } from "@/lib/audit";
import { validateUpload, sanitizeImage, type FileKind } from "@/lib/upload-validate";

// Embeddings + OCR/PDF parsing run on the Node runtime.
export const runtime = "nodejs";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Extract raw text from a validated policy file (PDF / image / text). */
async function fileToText(buf: ArrayBuffer, kind: FileKind): Promise<string> {
  if (kind === "pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  }
  if (kind === "text") {
    return new TextDecoder().decode(buf);
  }
  // image kinds — strip metadata / cap size before OCR
  const clean = await sanitizeImage(buf, kind);
  const mime = kind === "png" ? "image/png" : kind === "webp" ? "image/webp" : "image/jpeg";
  const { recognize } = await import("tesseract.js");
  const { data } = await recognize(`data:${mime};base64,${clean.toString("base64")}`, "eng");
  return data.text ?? "";
}

export async function POST(req: Request) {
  // Ingestion writes to the shared knowledge base — restrict to admins to prevent
  // corpus poisoning / indirect prompt injection by ordinary users.
  const gate = await requireRole(["admin"]);
  if (!gate.ok) return gate.res;

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data with a file" }, { status: 400 });
  }

  // Ensure the built-in corpus is present so uploads augment rather than race it.
  await ensureSeeded();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "File exceeds 8 MB limit" }, { status: 413 });

  const buf = await file.arrayBuffer();
  const check = validateUpload(new Uint8Array(buf), ["pdf", "png", "jpeg", "webp"], true);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  let text: string;
  try {
    text = await fileToText(buf, check.kind);
  } catch (e) {
    // Log detail server-side only; return a generic message to avoid leaking
    // internal paths / parser internals to the caller (CWE-209).
    console.error("[rag/ingest] file read failed:", (e as Error).message);
    return NextResponse.json({ error: "Could not process the uploaded file." }, { status: 422 });
  }
  if (!text || text.trim().length < 20) {
    return NextResponse.json({ error: "No extractable text found (scanned PDFs need an image upload)" }, { status: 422 });
  }

  const title = (form.get("title") as string | null)?.trim() || file.name.replace(/\.[^.]+$/, "");
  const docId = `UP-${Date.now().toString(36).toUpperCase()}`;

  const { chunks } = await ingestDocument({
    docId,
    docTitle: title,
    text,
    source: "upload",
    category: "Uploaded",
  });

  await audit({
    type: "RAG_INGEST",
    actorId: gate.value.id,
    actorRole: gate.value.role,
    target: docId,
    decision: "allow",
    detail: `ingested "${title}" (${chunks} chunks)`,
    ip: clientIpFromHeaders(req.headers),
  });

  return NextResponse.json({
    docId,
    title,
    chunks,
    totalChunks: await vectorStore.size(),
    message: `Indexed "${title}" as ${docId} (${chunks} passage${chunks === 1 ? "" : "s"}).`,
  });
}
