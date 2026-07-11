import { test, expect, describe } from "bun:test";
import { canAccessCustomer, scopeCustomers, isElevated, type Principal } from "@/lib/authz";
import { customers } from "@/lib/data";

const rm201: Principal = { role: "rm", rmId: "RM-201" };
const rm202: Principal = { role: "rm", rmId: "RM-202" };
const manager: Principal = { role: "manager", rmId: null };
const admin: Principal = { role: "admin", rmId: null };

describe("role elevation", () => {
  test("rm is not elevated; manager/compliance/admin are", () => {
    expect(isElevated(rm201)).toBe(false);
    expect(isElevated(manager)).toBe(true);
    expect(isElevated(admin)).toBe(true);
    expect(isElevated({ role: "compliance", rmId: null })).toBe(true);
  });
});

describe("canAccessCustomer", () => {
  test("RM can access own-book customer only", () => {
    expect(canAccessCustomer(rm201, { rmId: "RM-201" })).toBe(true);
    expect(canAccessCustomer(rm201, { rmId: "RM-202" })).toBe(false);
    expect(canAccessCustomer(rm202, { rmId: "RM-201" })).toBe(false);
  });
  test("elevated roles access any customer", () => {
    expect(canAccessCustomer(manager, { rmId: "RM-204" })).toBe(true);
    expect(canAccessCustomer(admin, { rmId: "RM-201" })).toBe(true);
  });
});

describe("scopeCustomers over the real dataset", () => {
  test("RM sees only their book; elevated sees everything", () => {
    const all = customers.length;
    const scoped = scopeCustomers(rm201, customers);
    expect(scoped.length).toBeGreaterThan(0);
    expect(scoped.length).toBeLessThan(all);
    expect(scoped.every((c) => c.rmId === "RM-201")).toBe(true);
    expect(scopeCustomers(admin, customers).length).toBe(all);
    expect(scopeCustomers(manager, customers).length).toBe(all);
  });
  test("the four RM books partition the full set", () => {
    const total = ["RM-201", "RM-202", "RM-203", "RM-204"]
      .map((rm) => scopeCustomers({ role: "rm", rmId: rm }, customers).length)
      .reduce((a, b) => a + b, 0);
    expect(total).toBe(customers.length);
  });
});
