// Pure authorization predicates — no framework / NextAuth / DB imports, so they
// are trivially unit-testable and can be reasoned about in isolation. The
// request-bound helpers (session lookup, 401/404 responses) live in auth-guard.ts.

import type { Customer } from "./data";
import { ELEVATED_ROLES, type Role } from "./users";

/** The minimal identity needed to make an access decision. */
export type Principal = { role: Role; rmId: string | null };

/** Roles that are NOT restricted to a single RM's book. */
export function isElevated(u: Principal): boolean {
  return ELEVATED_ROLES.includes(u.role);
}

/** True if the principal may see this customer (own book, or an elevated role). */
export function canAccessCustomer(u: Principal, c: Pick<Customer, "rmId">): boolean {
  return isElevated(u) || c.rmId === u.rmId;
}

/** Filter rows to what the principal is allowed to see. */
export function scopeCustomers<T extends { rmId: string }>(u: Principal, rows: T[]): T[] {
  return isElevated(u) ? rows : rows.filter((r) => r.rmId === u.rmId);
}
