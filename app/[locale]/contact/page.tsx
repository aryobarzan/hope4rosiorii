import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { getAnimal } from "@/lib/animals";
import { getSiteSettings } from "@/lib/site-settings";
import ContactForm from "./ContactForm";
const linkClass =
  "rounded underline underline-offset-4 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

// With cacheComponents, searchParams is runtime data and must be read inside
// <Suspense>. Isolating it here keeps the rest of the page prerendered; only
// the form streams in. An unknown or repeated slug is ignored.
async function PrefilledContactForm({
  searchParams,
}: {
  searchParams: Promise<{ dog?: string | string[] }>;
}) {
  const { dog: slug } = await searchParams;
  const locale = await getLocale();
  const dog =
    typeof slug === "string" ? await getAnimal(slug, locale) : undefined;
  // key: useForm only reads defaultValues on mount, so a different dog has to
  // remount the form or the previous dog's name would stay in the message.
  return <ContactForm key={dog?.slug ?? "no-dog"} dogName={dog?.name ?? undefined} />;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ContactPage.metadata");
  return { title: t("title"), description: t("description") };
}

export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ dog?: string | string[] }>;
}) {
  const t = await getTranslations("ContactPage");
  const settings = await getSiteSettings();

  return (
    <div className="page-container flex flex-col gap-1 pb-8 pt-8">
      <p className="font-heading text-xl text-link">{t("eyebrow")}</p>
      <h1 className="font-heading text-5xl">{t("heading")}</h1>
      {/* Stacked on small screens; side by side from lg. items-start stops the
          box stretching to the form's height, so it only takes what it needs. */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* The fallback is the plain form, so the layout does not jump. */}
        <Suspense fallback={<ContactForm />}>
          <PrefilledContactForm searchParams={searchParams} />
        </Suspense>
        <div className="flex flex-col gap-1 prominent-box">
          <p className="font-bold">{t("email")}</p>
          {/* self-start so it shrinks to its content's width */}
          <a
            href={`mailto:${settings.contactEmail}`}
            className={`${linkClass} self-start`}
          >
            {settings.contactEmail}
          </a>
          <p className="font-bold mt-4">{t("followUs")}</p>
          <p>
            <a
              href={settings.instagramUrl}
              target="_blank"
              className={linkClass}
            >
              Instagram
            </a>{" "}
            ·{" "}
            <a
              href={settings.facebookUrl}
              target="_blank"
              className={linkClass}
            >
              Facebook
            </a>{" "}
            ·{" "}
            <a
              href={settings.tiktokUrl}
              target="_blank"
              className={linkClass}
            >
              TikTok
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
