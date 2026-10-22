import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { sendMail } from "@/lib/mail";
import { isRateLimited } from "@/lib/rate-limit";
import { validAdoption as valid } from "@/lib/schemas/adopt.fixture";
import lb from "@/messages/lb.json";
import { sendAdoptionRequest } from "./actions";

vi.mock("@/lib/mail", () => ({
  sendMail: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({ isRateLimited: vi.fn() }));

const locale = routing.defaultLocale;

describe("adoption actions", () => {
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

  it("sends the mail and returns ok for a valid request", async () => {
    const result = await sendAdoptionRequest(locale, valid);

    expect(sendMail).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true });
  });

  it("returns ok for a filled-out website field (honeypot) without sending any mail", async () => {
    const result = await sendAdoptionRequest(locale, {
      ...valid,
      website: "example.com",
    });

    // The honeypot check runs before validation and the rate limiter
    expect(isRateLimited).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  it("returns the 'invalid' error for an unknown locale", async () => {
    const result = await sendAdoptionRequest("xx", valid);

    expect(isRateLimited).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: "invalid" });
  });

  it.each([undefined, null, "", {}, { garbage: true }])(
    "returns the 'invalid' error for an invalid input body (%j)",
    async (invalidInput) => {
      const result = await sendAdoptionRequest(locale, invalidInput as never);

      expect(isRateLimited).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error: "invalid" });
    },
  );

  // The schema tests cover every rule. These rows only show that a failure of
  // any kind stops the action before the limiter and the mailer.
  it.each([
    ["an empty name", { name: "" }],
    ["an invalid email", { email: "invalid-email" }],
    ["a missing dog name", { dogName: undefined }],
    ["a missing answer", { hasShelterDogExperience: undefined }],
    ["an unticked GDPR consent", { consent: false }],
    ["'other' without details", { employed: "other" }],
  ])(
    "returns the 'invalid' error for %s",
    async (_description, overrides) => {
      const input = { ...valid, ...overrides } as never;
      const result = await sendAdoptionRequest(locale, input);

      expect(isRateLimited).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error: "invalid" });
    },
  );

  it("returns the 'rateLimited' error due to rate limit", async () => {
    vi.mocked(isRateLimited).mockReturnValue(true);

    const result = await sendAdoptionRequest(locale, valid);

    expect(sendMail).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: "rateLimited" });
  });

  it("uses a stricter limit than the contact form: 3 requests", async () => {
    await sendAdoptionRequest(locale, valid);

    expect(isRateLimited).toHaveBeenCalledWith("adopt:1.2.3.4", 3);
  });

  it.each([
    ["a single address", { "x-forwarded-for": "1.2.3.4" }, "adopt:1.2.3.4"],
    [
      "several addresses (the first one wins)",
      { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      "adopt:1.2.3.4",
    ],
    [
      "an address with spaces around it",
      { "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" },
      "adopt:1.2.3.4",
    ],
    ["no header", {}, "adopt:unknown"],
    ["an empty header", { "x-forwarded-for": "" }, "adopt:unknown"],
  ])(
    "rate-limits by the client address: %s",
    async (_description, headerInit, expectedKey) => {
      vi.mocked(headers).mockResolvedValue(new Headers(headerInit) as never);

      await sendAdoptionRequest(locale, valid);

      expect(isRateLimited).toHaveBeenCalledWith(expectedKey, 3);
    },
  );

  it("returns the 'sendFailed' error due to sendMail error", async () => {
    const error = new Error("SMTP is down");
    vi.mocked(sendMail).mockRejectedValue(error);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendAdoptionRequest(locale, valid);

    expect(sendMail).toHaveBeenCalled();
    // The applicant only gets the generic result: nothing about the cause
    expect(result).toEqual({ ok: false, error: "sendFailed" });
    // The cause is logged server-side for the team
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), error);
  });

  it("emails the team in the default language and sets the applicant as reply-to", async () => {
    // The applicant uses English, the team reads Luxembourgish (the default)
    const result = await sendAdoptionRequest("en", valid);

    // Built from the lb messages, so a wording change doesn't break the test
    expect(result).toEqual({ ok: true });
    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail).toHaveBeenCalledWith({
      subject: lb.AdoptionEmail.subject.replace("{dogName}", "Rex"),
      text: expect.any(String),
      replyTo: { name: "Anna Muller", address: "anna@example.com" },
    });

    const { text } = vi.mocked(sendMail).mock.calls[0][0];
    // The applicant's language is reported, not used for the email itself
    expect(text).toContain(`${lb.AdoptionEmail.language}: en`);
    // The body is built in the team's language, from the form's answers
    expect(text).toContain(`== ${lb.AdoptPage.sections.contact} ==`);
    expect(text).toContain("Anna Muller");
    expect(text).toContain("Rex");
  });

  it("ignores unexpected fields and sends only what the form defines", async () => {
    const input = { ...valid, to: "evil@example.com", bcc: "evil@example.com" };

    await sendAdoptionRequest(locale, input as never);

    const mail = vi.mocked(sendMail).mock.calls[0][0];
    expect(Object.keys(mail).sort()).toEqual(["replyTo", "subject", "text"]);
    expect(JSON.stringify(mail)).not.toContain("evil@example.com");
  });
});
