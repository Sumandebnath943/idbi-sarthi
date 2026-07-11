import { test, expect, describe } from "bun:test";
import {
  maskAadhaar,
  maskPAN,
  maskAccount,
  maskPhone,
  maskEmail,
  redactPII,
} from "@/lib/kyc-validate";

describe("PII masking", () => {
  test("Aadhaar keeps only last 4", () => {
    expect(maskAadhaar("234567890123")).toBe("XXXX-XXXX-0123");
    expect(maskAadhaar("2345 6789 0123")).toBe("XXXX-XXXX-0123");
  });

  test("PAN masks the middle", () => {
    expect(maskPAN("ABCDE1234F")).toBe("ABXXXXXX4F");
    expect(maskPAN("bad")).toBe("XXXXXXXXXX");
  });

  test("account keeps only last 4", () => {
    expect(maskAccount("123456789012345")).toBe("XXXX2345");
  });

  test("phone keeps only last 4", () => {
    expect(maskPhone("9876543210")).toBe("XXXXXX3210");
  });

  test("email keeps first char + domain", () => {
    expect(maskEmail("john.doe@example.com")).toBe("j***@example.com");
  });
});

describe("redactPII on free text", () => {
  const raw =
    "Aadhaar 2345 6789 0123, PAN ABCDE1234F, email john.doe@example.com, phone 9876543210, A/C 123456789012345";
  const red = redactPII(raw);

  test("removes the full Aadhaar", () => {
    expect(red).not.toContain("2345 6789 0123");
    expect(red).toContain("XXXX XXXX XXXX");
  });
  test("removes the full PAN", () => {
    expect(red).not.toContain("ABCDE1234F");
  });
  test("removes the full email local part", () => {
    expect(red).not.toContain("john.doe@example.com");
  });
  test("removes the full phone number", () => {
    expect(red).not.toContain("9876543210");
  });
  test("removes the full account number", () => {
    expect(red).not.toContain("123456789012345");
  });
});
