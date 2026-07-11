import { NextResponse } from "next/server";
import { ensureSeeded, ingestDocument } from "@/lib/ingest";
import { vectorStore } from "@/lib/vectors";

// Embeddings + OCR/PDF parsing run on the Node runtime.
export const runtime = "nodejs";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Extract raw text from an uploaded policy file (PDF / image / text). */
async function fileToText(file: File): Promise<string> {
  const type = file.type || "";
  const name = file.name.toLowerCase();
  const buf = await file.arrayBuffer();

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  }
  if (type.startsWith("image/")) {
    const { recognize } = await import("tesseract.js");
    const dataUrl = `data:${type};base64,${Buffer.from(buf).toString("base64")}`;
    const { data } = await recognize(dataUrl, "eng");
    return data.text ?? "";
  }
  return new TextDecoder().decode(buf);
}

export async function POST(req: Request) {
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

  let text: string;
  try {
    text = await fileToText(file);
  } catch (e) {
    return NextResponse.json({ error: `Could not read file: ${(e as Error).message}` }, { status: 422 });
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

  return NextResponse.json({
    docId,
    title,
    chunks,
    totalChunks: await vectorStore.size(),
    message: `Indexed "${title}" as ${docId} (${chunks} passage${chunks === 1 ? "" : "s"}).`,
  });
}
