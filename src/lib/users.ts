// App user store for authentication (Phase 1 security hardening).
//
// Single source of truth for demo identities (`SEED_USERS`). Two backends:
//   - Supabase `app_users` table  — used when SUPABASE_URL + a key are set
//     (persists across serverless invocations; demonstrates RLS). Seed it with
//     `bun run scripts/seed-users.mjs`.
//   - Static in-memory fallback   — used for zero-config local dev. Passwords are
//     hashed once with bcrypt at first use.
//
// NOTE: all data in this app is SYNTHETIC. These demo passwords guard a synthetic
// dataset only; there is no real customer data behind them. Real deployments must
// replace this with an enterprise IdP (OIDC/SAML) — see docs/SECURITY_FIX_PLAN.md.

import bcrypt from "bcryptjs";

export type Role = "rm" | "manager" | "compliance" | "admin";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  rmId: string | null; // null for roles that see the whole book (manager/compliance/admin)
};

type StoredUser = AppUser & { passwordHash: string };

// Roles that are NOT restricted to a single RM book.
export const ELEVATED_ROLES: Role[] = ["manager", "compliance", "admin"];

// Demo password (override via env for a shared deploy). Documented in the README
// so hackathon judges can log in. Synthetic data only.
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "Sarthi@2026!";

// RM ids (RM-201..RM-204) mirror the assignments in src/lib/data.ts.
export const SEED_USERS: (AppUser & { password: string })[] = [
  { id: "u-rm-201", email: "anjali@idbi.demo", name: "Anjali Mehta", role: "rm", rmId: "RM-201", password: DEMO_PASSWORD },
  { id: "u-rm-202", email: "rohit@idbi.demo", name: "Rohit Sharma", role: "rm", rmId: "RM-202", password: DEMO_PASSWORD },
  { id: "u-rm-203", email: "sneha@idbi.demo", name: "Sneha Reddy", role: "rm", rmId: "RM-203", password: DEMO_PASSWORD },
  { id: "u-rm-204", email: "vikram@idbi.demo", name: "Vikram Singh", role: "rm", rmId: "RM-204", password: DEMO_PASSWORD },
  { id: "u-manager", email: "manager@idbi.demo", name: "Deepa Krishnan", role: "manager", rmId: null, password: DEMO_PASSWORD },
  { id: "u-admin", email: "admin@idbi.demo", name: "System Admin", role: "admin", rmId: null, password: DEMO_PASSWORD },
];

let fallbackCache: StoredUser[] | null = null;
function fallbackUsers(): StoredUser[] {
  if (!fallbackCache) {
    fallbackCache = SEED_USERS.map(({ password, ...u }) => ({
      ...u,
      passwordHash: bcrypt.hashSync(password, 10),
    }));
  }
  return fallbackCache;
}

function supabaseUsersEnabled(): boolean {
  if (process.env.USER_STORE === "seed") return false;
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
}

async function findInSupabase(email: string): Promise<StoredUser | null> {
  const url = process.env.SUPABASE_URL!;
  // app_users holds password hashes and is RLS-locked (no anon/authenticated
  // access). The login lookup runs only on the server, so it uses the service
  // role key. Never expose this table or key to the client.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY!;
  const { createClient } = await import("@supabase/supabase-js");
  const c = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await c
    .from("app_users")
    .select("id,email,name,role,rm_id,password_hash,is_active")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as Role,
    rmId: data.rm_id,
    passwordHash: data.password_hash,
  };
}

async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const e = email.trim().toLowerCase();
  if (supabaseUsersEnabled()) {
    try {
      const u = await findInSupabase(e);
      if (u) return u;
    } catch {
      // fall through to the static seed so the demo still logs in
    }
  }
  return fallbackUsers().find((u) => u.email === e) ?? null;
}

// A bcrypt hash of a random string — used to spend comparable time on unknown
// users so response timing doesn't reveal whether an email exists.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8m1p8fJ0k8m1p8fJ0k8m1p8fJ0k8mC";

export async function verifyCredentials(email: string, password: string): Promise<AppUser | null> {
  const u = await findUserByEmail(email);
  if (!u) {
    await bcrypt.compare(password, DUMMY_HASH); // constant-ish time
    return null;
  }
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return null;
  const { passwordHash: _ph, ...safe } = u;
  return safe;
}
