"use server";

import { createTranslator, hasLocale } from "next-intl";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { sendMail } from "@/lib/mail";
import { isRateLimited } from "@/lib/rate-limit";
import { contactSchema, type ContactInput } from "@/lib/schemas/contact";

export type ContactResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "rateLimited" | "sendFailed" };

// Server Actions are public endpoints: everything below treats its arguments
// as untrusted, even though our own form produced them.
//
// The locale is passed in explicitly because next/root-params doesn't work in
// Server Actions yet.
export async function sendContactMessage(
  locale: string,
  input: ContactInput,
): Promise<ContactResult> {
  // Honeypot: pretend it worked so the bot has nothing to adapt to
  if (typeof input?.website === "string" && input.website !== "") {
    return { ok: true };
  }

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success || !hasLocale(routing.locales, locale)) {
    return { ok: false, error: "invalid" };
  }
  const { name, email, reason, message } = parsed.data;

  const forwardedFor = (await headers()).get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`contact:${ip}`)) {
    return { ok: false, error: "rateLimited" };
  }

  // The email is for the team, so it is written in their language (the
  // default locale), whatever language the visitor used
  const messages = (await import(`@/messages/${routing.defaultLocale}.json`))
    .default;
  const t = createTranslator({
    locale: routing.defaultLocale,
    messages,
    namespace: "ContactEmail",
  });
  const reasonLabel = createTranslator({
    locale: routing.defaultLocale,
    messages,
    namespace: "ContactPage.reasons",
  })(reason);

  try {
    await sendMail({
      subject: t("subject", { reason: reasonLabel }),
      text: [
        `${t("name")}: ${name}`,
        `${t("email")}: ${email}`,
        `${t("reason")}: ${reasonLabel}`,
        `${t("language")}: ${locale}`,
        "",
        message,
      ].join("\n"),
      replyTo: { name, address: email },
    });
  } catch (error) {
    // Logged server-side only: the visitor just gets a generic failure
    console.error("Contact email failed", error);
    return { ok: false, error: "sendFailed" };
  }

  return { ok: true };
}
