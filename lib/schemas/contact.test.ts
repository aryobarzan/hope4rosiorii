import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact";

const valid = {
  name: "Anna Muller",
  email: "anna@example.com",
  reason: "general",
  message: "Hello!",
  consent: true,
  website: "",
};

// Error messages are message keys, so the tests check keys per field
function errors(input: unknown) {
  const result = contactSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("contactSchema", () => {
  it("accepts a complete message", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("trims name and message", () => {
    const result = contactSchema.parse({
      ...valid,
      name: "  Anna  ",
      message: "  Hi  ",
    });
    expect(result.name).toBe("Anna");
    expect(result.message).toBe("Hi");
  });

  it("requires name and message, even when only spaces", () => {
    expect(errors({ ...valid, name: "   ", message: "" })).toEqual({
      name: "required",
      message: "required",
    });
  });

  it("rejects an invalid email", () => {
    expect(errors({ ...valid, email: "not-an-email" })).toEqual({
      email: "invalidEmail",
    });
  });

  it("rejects too-long fields", () => {
    expect(
      errors({ ...valid, name: "a".repeat(101), message: "a".repeat(2001) }),
    ).toEqual({ name: "tooLong", message: "tooLong" });
  });

  it("rejects an unknown reason", () => {
    expect(errors({ ...valid, reason: "spam" })).toHaveProperty("reason");
  });

  it("requires GDPR consent", () => {
    expect(errors({ ...valid, consent: false })).toEqual({
      consent: "consentRequired",
    });
  });

  it("rejects a filled honeypot", () => {
    expect(errors({ ...valid, website: "http://spam.example" })).toHaveProperty(
      "website",
    );
  });
});
