import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Safely parse and validate a JSON request body against a zod schema.
 *
 * Returns either `{ data }` on success or `{ response }` holding a ready-to-return
 * 400 NextResponse when the body is missing, not valid JSON, or fails validation.
 *
 * Usage:
 *   const parsed = await parseBody(req, MySchema);
 *   if (parsed.response) return parsed.response;
 *   const body = parsed.data;
 */
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<{ data: z.infer<T>; response?: never } | { data?: never; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { response: NextResponse.json({ error: "Invalid or empty JSON body" }, { status: 400 }) };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      response: NextResponse.json(
        { error: "Validation failed", issues: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}
