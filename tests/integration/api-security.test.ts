import { test, expect, describe, beforeAll } from "bun:test";

// End-to-end security acceptance tests. Requires the app running (bun run dev).
// Set TEST_BASE_URL to point elsewhere. If the server is unreachable the whole
// suite is skipped so `bun test` still passes in environments without a server.

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const PASSWORD = process.env.DEMO_USER_PASSWORD ?? "Sarthi@2026!";

async function serverUp(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/login`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}
const SERVER_UP = await serverUp();
if (!SERVER_UP) {
  console.warn(`[integration] ${BASE} unreachable — skipping API security suite. Start the app with 'bun run dev'.`);
}

/** Cookie-jar login; returns a Cookie header carrying the session. */
async function login(email: string, password: string): Promise<string> {
  const jar = new Map<string, string>();
  const apply = (res: Response) => {
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1));
    }
  };
  const header = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");

  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { headers: { cookie: header() } });
  apply(csrfRes);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const body = new URLSearchParams({ csrfToken, email, password, json: "true" });
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { cookie: header(), "content-type": "application/x-www-form-urlencoded" },
    body,
    redirect: "manual",
  });
  apply(loginRes);
  return header();
}

const get = (path: string, cookie?: string) =>
  fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {}, redirect: "manual" });

describe.skipIf(!SERVER_UP)("unauthenticated access is denied", () => {
  for (const path of [
    "/api/customers",
    "/api/customers/CUST-1001",
    "/api/analytics",
    "/api/leads",
    "/api/nba",
    "/api/health-score?customerId=CUST-1001",
    "/api/risk/predict?customerId=CUST-1001",
    "/api/explain?customerId=CUST-1001",
    "/api/schemes/match?customerId=CUST-1001",
    "/api/status",
  ]) {
    test(`GET ${path} -> 401`, async () => {
      expect((await get(path)).status).toBe(401);
    });
  }
});

describe.skipIf(!SERVER_UP)("RM is scoped to their own book", () => {
  let rm: string;
  beforeAll(async () => {
    rm = await login("anjali@idbi.demo", PASSWORD); // RM-201
  });

  test("session carries role + rmId", async () => {
    const s = (await get("/api/auth/session", rm).then((r) => r.json())) as {
      user?: { role?: string; rmId?: string };
    };
    expect(s.user?.role).toBe("rm");
    expect(s.user?.rmId).toBe("RM-201");
  });

  test("customer list is scoped (not all 24)", async () => {
    const j = (await get("/api/customers", rm).then((r) => r.json())) as { total: number; customers: { rmId: string }[] };
    expect(j.total).toBeLessThan(24);
    expect(j.customers.every((c) => c.rmId === "RM-201")).toBe(true);
  });

  test("own customer 200, other RM's customer 404", async () => {
    expect((await get("/api/customers/CUST-1001", rm)).status).toBe(200); // RM-201
    expect((await get("/api/customers/CUST-1002", rm)).status).toBe(404); // RM-202
  });

  test("cross-RM analytics routes return 404 (not 403 — no id confirmation)", async () => {
    for (const p of [
      "/api/health-score?customerId=CUST-1002",
      "/api/risk/predict?customerId=CUST-1002",
      "/api/explain?customerId=CUST-1002",
      "/api/schemes/match?customerId=CUST-1002",
    ]) {
      expect((await get(p, rm)).status).toBe(404);
    }
  });

  test("RM cannot ingest into the knowledge base (admin-only) -> 403", async () => {
    const fd = new FormData();
    fd.append("file", new Blob(["policy text"], { type: "text/plain" }), "p.txt");
    const r = await fetch(`${BASE}/api/rag/ingest`, { method: "POST", headers: { cookie: rm }, body: fd });
    expect(r.status).toBe(403);
  });
});

describe.skipIf(!SERVER_UP)("elevated roles see the whole book", () => {
  test("admin sees all customers and any record", async () => {
    const admin = await login("admin@idbi.demo", PASSWORD);
    const j = (await get("/api/customers", admin).then((r) => r.json())) as { total: number };
    expect(j.total).toBe(24);
    expect((await get("/api/customers/CUST-1002", admin)).status).toBe(200);
  });
});

describe.skipIf(!SERVER_UP)("document API masks/redacts PII in the response", () => {
  test("Aadhaar/PAN never returned in cleartext", async () => {
    const rm = await login("anjali@idbi.demo", PASSWORD);
    const body = JSON.stringify({
      text: "PAN ABCDE1234F Aadhaar 2345 6789 0123 phone 9876543210 email a.b@x.com",
      filename: "kyc.txt",
      customerId: "CUST-1001",
    });
    const r = await fetch(`${BASE}/api/documents`, {
      method: "POST",
      headers: { cookie: rm, "content-type": "application/json" },
      body,
    });
    expect(r.status).toBe(200);
    const raw = await r.text();
    expect(raw).not.toContain("ABCDE1234F"); // full PAN
    expect(raw).not.toContain("2345 6789 0123"); // full Aadhaar
    expect(raw).not.toContain("9876543210"); // full phone
  });
});
