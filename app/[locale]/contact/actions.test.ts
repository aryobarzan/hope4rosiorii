import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import lb from "@/messages/lb.json";
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

const locale = routing.defaultLocale;

describe("contact actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(
      new Headers({ "x-forwarded-for": "1.2.3.4" }) as never,
    );
    vi.mocked(isRateLimited).mockReturnValue(false);
    vi.mocked(sendMail).mockResolvedValue(undefined);
  });
  afterEach(() => {
    // Only undoes vi.spyOn (the console spy below); the mocks above are
    // given their defaults again in beforeEach
    vi.restoreAllMocks();
  });

  it("sends the mail and returns ok for a valid message", async () => {
    const input = valid;
    const result = await sendContactMessage(locale, input);

    expect(sendMail).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
  });

  it("returns ok for a filled-out website field (honeypot) without sending any mail", async () => {
    const input = { ...valid, website: "example.com" };
    const result = await sendContactMessage(locale, input);

    expect(isRateLimited).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it("returns the 'invalid' error for an unknown locale", async () => {
    const result = await sendContactMessage("xx", valid);

    expect(isRateLimited).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: "invalid" });
  });

  it.each([undefined, null, "", {}, { garbage: true }])(
    "returns the 'invalid' error for an invalid input body (%j)",
    async (invalidInput) => {
      const input = invalidInput as never;
      const result = await sendContactMessage(locale, input);

      expect(isRateLimited).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error: "invalid" });
    },
  );

  it.each([undefined, null, ""])(
    "returns the 'invalid' error for an invalid input name (%j)",
    async (name) => {
      const input = { ...valid, name: name } as never;
      const result = await sendContactMessage(locale, input);

      expect(isRateLimited).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error: "invalid" });
    },
  );

  it.each([undefined, null, "invalid-email"])(
    "returns the 'invalid' error for an invalid input email (%j)",
    async (email) => {
      const input = { ...valid, email: email } as never;
      const result = await sendContactMessage(locale, input);

      expect(isRateLimited).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error: "invalid" });
    },
  );

  it.each([undefined, null, ""])(
    "returns the 'invalid' error for an invalid input reason (%j)",
    async (reason) => {
      const input = { ...valid, reason: reason } as never;
      const result = await sendContactMessage(locale, input);

      expect(isRateLimited).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error: "invalid" });
    },
  );

  it.each([undefined, null, ""])(
    "returns the 'invalid' error for an invalid input message (%j)",
    async (message) => {
      const input = { ...valid, message: message } as never;
      const result = await sendContactMessage(locale, input);

      expect(isRateLimited).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error: "invalid" });
    },
  );

  it("returns the 'rateLimited' error due to rate limit", async () => {
    const input = valid;
    vi.mocked(isRateLimited).mockReturnValue(true);

    const result = await sendContactMessage(locale, input);

    expect(sendMail).not.toHaveBeenCalled();
    expect(isRateLimited).toHaveBeenCalledWith("contact:1.2.3.4");
    expect(result).toEqual({ ok: false, error: "rateLimited" });
  });

  it.each([
    ["a single address", { "x-forwarded-for": "1.2.3.4" }, "contact:1.2.3.4"],
    [
      "several addresses (the first one wins)",
      { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      "contact:1.2.3.4",
    ],
    [
      "an address with spaces around it",
      { "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" },
      "contact:1.2.3.4",
    ],
    ["no header", {}, "contact:unknown"],
    ["an empty header", { "x-forwarded-for": "" }, "contact:unknown"],
  ])(
    "rate-limits by the client address: %s",
    async (_description, headerInit, expectedKey) => {
      vi.mocked(headers).mockResolvedValue(new Headers(headerInit) as never);

      await sendContactMessage(locale, valid);

      expect(isRateLimited).toHaveBeenCalledWith(expectedKey);
    },
  );

  it("returns the 'sendFailed' error due to sendMail error", async () => {
    const input = valid;
    const error = new Error("SMTP is down");
    vi.mocked(sendMail).mockRejectedValue(error);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendContactMessage(locale, input);

    expect(sendMail).toHaveBeenCalled();
    // The visitor only gets the generic result: nothing about the cause
    expect(result).toEqual({ ok: false, error: "sendFailed" });
    // The cause is logged server-side for the team
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), error);
  });

  it("emails the team in the default language and sets the visitor as reply-to", async () => {
    // The visitor uses English, the team reads Luxembourgish (the default)
    const result = await sendContactMessage("en", valid);

    // Built from the lb messages, so a wording change doesn't break the test
    const reason = lb.ContactPage.reasons.general;
    expect(result).toEqual({ ok: true });
    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail).toHaveBeenCalledWith({
      subject: lb.ContactEmail.subject.replace("{reason}", reason),
      text: expect.stringContaining(`${lb.ContactEmail.name}: Anna Muller`),
      replyTo: { name: "Anna Muller", address: "anna@example.com" },
    });
    const { text } = vi.mocked(sendMail).mock.calls[0][0];
    expect(text).toContain(`${lb.ContactEmail.email}: anna@example.com`);
    expect(text).toContain(`${lb.ContactEmail.reason}: ${reason}`);
    // The visitor's language is reported, not used for the email itself
    expect(text).toContain(`${lb.ContactEmail.language}: en`);
    expect(text).toContain("Hello!");
  });

  it("ignores unexpected fields and sends only what the form defines", async () => {
    const input = { ...valid, to: "evil@example.com", bcc: "evil@example.com" };

    await sendContactMessage(locale, input as never);

    const mail = vi.mocked(sendMail).mock.calls[0][0];
    expect(Object.keys(mail).sort()).toEqual(["replyTo", "subject", "text"]);
    expect(JSON.stringify(mail)).not.toContain("evil@example.com");
  });
});
