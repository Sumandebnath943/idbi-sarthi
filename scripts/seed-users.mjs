// Seed the Supabase `app_users` table with the demo identities.
//
//   1. Run supabase/auth-schema.sql in the Supabase SQL editor first.
//   2. Ensure SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are in .env.local.
//   3. bun run scripts/seed-users.mjs
//
// Mirrors SEED_USERS in src/lib/users.ts. Passwords are demo-only (synthetic
// data). Override the shared password with DEMO_USER_PASSWORD.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// Minimal .env.local loader (no dotenv dependency).
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* .env.local optional if vars already exported */
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "Sarthi@2026!";
const USERS = [
  { id: "u-rm-201", email: "anjali@idbi.demo", name: "Anjali Mehta", role: "rm", rm_id: "RM-201" },
  { id: "u-rm-202", email: "rohit@idbi.demo", name: "Rohit Sharma", role: "rm", rm_id: "RM-202" },
  { id: "u-rm-203", email: "sneha@idbi.demo", name: "Sneha Reddy", role: "rm", rm_id: "RM-203" },
  { id: "u-rm-204", email: "vikram@idbi.demo", name: "Vikram Singh", role: "rm", rm_id: "RM-204" },
  { id: "u-manager", email: "manager@idbi.demo", name: "Deepa Krishnan", role: "manager", rm_id: null },
  { id: "u-admin", email: "admin@idbi.demo", name: "System Admin", role: "admin", rm_id: null },
];

const client = createClient(url, key, { auth: { persistSession: false } });

const rows = USERS.map((u) => ({
  ...u,
  password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10),
  is_active: true,
}));

const { error } = await client.from("app_users").upsert(rows, { onConflict: "id" });
if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}
console.log(`Seeded ${rows.length} users into app_users. Shared demo password: ${DEMO_PASSWORD}`);
