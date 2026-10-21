import { describe, expect, it, vi, beforeEach } from "vitest";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { sendMail } from "@/lib/mail";
import { isRateLimited } from "@/lib/rate-limit";
import { type ContactInput } from "@/lib/schemas/contact";
import { sendContactMessage } from "./actions";

vi.mock("@/lib/mail", () => ({
  sendMail: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({ isRateLimited: vi.fn() }));

const valid: ContactInput = {
  name: "Anna Muller",
  email: "anna@example.com",
  reason: "general",
  message: "Hello!",
  consent: true,
  website: "",
};
const invalid: ContactInput = {
  name: "",
  email: "anna@example.com",
  reason: "general",
  message: "Hello!",
  consent: true,
  website: "",
};
const locale = routing.defaultLocale;

describe("contact actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(
      new Headers({ "x-forwarded-for": "1.2.3.4" }) as never,
    );
    vi.mocked(isRateLimited).mockReturnValue(false);
  });

  it("sends the mail and returns ok for a valid message", async () => {
    const input = valid;
    const result = await sendContactMessage(locale, input);

    expect(sendMail).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
  });

  it("returns the 'invalid' error for an invalid input", async () => {
    const input = invalid;
    const result = await sendContactMessage(locale, input);

    expect(sendMail).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: "invalid" });
  });

  it("returns the 'rateLimited' error due to rate limit", async () => {
    const input = valid;
    vi.mocked(isRateLimited).mockReturnValue(true);

    const result = await sendContactMessage(locale, input);

    expect(sendMail).not.toHaveBeenCalled();
    expect(isRateLimited).toHaveBeenCalledWith("contact:1.2.3.4");
    expect(result).toEqual({ ok: false, error: "rateLimited" });
  });
});
