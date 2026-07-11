// Append-only audit logging (RBI IT Framework / DPDP Act 2023 posture).
//
// Records WHO did WHAT to WHICH target and the authorization decision. It must
// never contain secrets or raw PII — only ids, types, and masked/summary detail.
//
// Backend: writes to a Supabase `audit_log` table when configured, else logs to
// stdout (captured by the platform). Failures never break the request path.

type AuditType =
  | "AUTH_SUCCESS"
  | "AUTH_FAILURE"
  | "DATA_ACCESS"
  | "DOCUMENT_UPLOAD"
  | "LLM_QUERY"
  | "RAG_SEARCH"
  | "RAG_INGEST"
  | "AUTHZ_DENIED"
  | "RATE_LIMIT";

export type AuditEvent = {
  type: AuditType;
  actorId?: string;
  actorRole?: string;
  target?: string; // e.g. customerId / docId — never PII
  decision: "allow" | "deny";
  detail?: string; // short, PII-free
  ip?: string;
  correlationId?: string;
};

/** Extract a best-effort client IP from request headers (for the audit trail). */
export function clientIpFromHeaders(headers: Headers): string {
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

function auditBackend(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL;
  // Writes to the append-only log go through the service role (server-only).
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (process.env.AUDIT_STORE === "console") return null;
  return { url, key };
}

export async function audit(ev: AuditEvent): Promise<void> {
  const row = { ...ev, ts: new Date().toISOString() };
  const backend = auditBackend();
  if (!backend) {
    // Structured stdout line — picked up by Vercel / container log drains.
    console.log("[AUDIT]", JSON.stringify(row));
    return;
  }
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const c = createClient(backend.url, backend.key, { auth: { persistSession: false } });
    const { error } = await c.from("audit_log").insert({
      type: row.type,
      actor_id: row.actorId ?? null,
      actor_role: row.actorRole ?? null,
      target: row.target ?? null,
      decision: row.decision,
      detail: row.detail ?? null,
      ip: row.ip ?? null,
      correlation_id: row.correlationId ?? null,
      ts: row.ts,
    });
    if (error) console.log("[AUDIT]", JSON.stringify(row), "(db error:", error.message + ")");
  } catch {
    console.log("[AUDIT]", JSON.stringify(row));
  }
}
