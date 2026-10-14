"use server";

import { createTranslator, hasLocale } from "next-intl";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { buildAdoptionEmail } from "@/lib/adoption-email";
import { sendMail } from "@/lib/mail";
import { isRateLimited } from "@/lib/rate-limit";
import { adoptionSchema, type AdoptionInput } from "@/lib/schemas/adopt";

export type AdoptionResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "rateLimited" | "sendFailed" };

// Server Actions are public endpoints: everything below treats its arguments
// as untrusted, even though our own form produced them.
//
// The locale is passed in explicitly because next/root-params doesn't work in
// Server Actions yet.
export async function sendAdoptionRequest(
  locale: string,
  input: AdoptionInput,
): Promise<AdoptionResult> {
  // Honeypot: pretend it worked so the bot has nothing to adapt to
  if (typeof input?.website === "string" && input.website !== "") {
    return { ok: true };
  }

  const parsed = adoptionSchema.safeParse(input);
  if (!parsed.success || !hasLocale(routing.locales, locale)) {
    return { ok: false, error: "invalid" };
  }
  const values = parsed.data;

  const forwardedFor = (await headers()).get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  // Stricter than the contact form: a request takes a long time to fill in, so
  // a handful per window is plenty (and a retry after a typo still fits)
  if (isRateLimited(`adopt:${ip}`, 3)) {
    return { ok: false, error: "rateLimited" };
  }

  // The email is for the team, so it is written in their language (the
  // default locale), whatever language the applicant used
  const emailLocale = routing.defaultLocale;
  const messages = (await import(`@/messages/${emailLocale}.json`)).default;
  const t = createTranslator({
    locale: emailLocale,
    messages,
    namespace: "AdoptionEmail",
  });

  try {
    await sendMail({
      subject: t("subject", { dogName: values.dogName }),
      text: [
        `${t("language")}: ${locale}`,
        "",
        buildAdoptionEmail(values, { locale: emailLocale, messages }),
      ].join("\n"),
      replyTo: { name: values.name, address: values.email },
    });
  } catch (error) {
    // Logged server-side only: the applicant just gets a generic failure
    console.error("Adoption email failed", error);
    return { ok: false, error: "sendFailed" };
  }

  return { ok: true };
}
