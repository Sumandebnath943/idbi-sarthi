// Server-side authorization helpers used INSIDE every API route handler.
//
// Defense in depth: the middleware already rejects unauthenticated /api/* calls,
// but we never rely on middleware alone (Next.js has a history of middleware
// authorization-bypass advisories). Every handler re-checks here.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { type Role } from "@/lib/users";
import { getCustomer, type Customer } from "@/lib/data";
import { canAccessCustomer } from "@/lib/authz";

// Re-export the pure predicates so route handlers keep importing them from here.
export { isElevated, canAccessCustomer, scopeCustomers } from "@/lib/authz";

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: Role;
  rmId: string | null;
};

export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u || !u.role) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role as Role, rmId: u.rmId ?? null };
}

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
export const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });
export const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

type Guard<T> = { ok: true; value: T } | { ok: false; res: NextResponse };

/** Require any authenticated user. */
export async function requireUser(): Promise<Guard<SessionUser>> {
  const user = await currentUser();
  if (!user) return { ok: false, res: unauthorized() };
  return { ok: true, value: user };
}

/** Require an authenticated user holding one of `roles`. */
export async function requireRole(roles: Role[]): Promise<Guard<SessionUser>> {
  const g = await requireUser();
  if (!g.ok) return g;
  if (!roles.includes(g.value.role)) return { ok: false, res: forbidden() };
  return g;
}

/**
 * Authenticate + load + authorize a customer by id.
 * Returns 404 (not 403) on an out-of-book id so attackers can't confirm which
 * ids exist by probing.
 */
export async function requireCustomer(id: string): Promise<Guard<{ user: SessionUser; customer: Customer }>> {
  const g = await requireUser();
  if (!g.ok) return g;
  const customer = getCustomer(id);
  if (!customer || !canAccessCustomer(g.value, customer)) return { ok: false, res: notFound() };
  return { ok: true, value: { user: g.value, customer } };
}
