import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { getAnimal } from "@/lib/animals";
import { getSiteSettings } from "@/lib/site-settings";
import ContactForm from "./ContactForm";
import AnimalPreviewCard from "../components/AnimalPreviewCard";
import AnimalPreviewSkeleton from "../components/AnimalPreviewSkeleton";

const linkClass =
  "rounded underline underline-offset-4 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

type SearchParams = Promise<{ dog?: string | string[] }>;

// Sidebar next to the form: contact details, plus the animal preview when
// there is one. An <aside> because it complements the form rather than being
// part of it.
async function ContactAside({ children }: { children?: ReactNode }) {
  const t = await getTranslations("ContactPage");
  const settings = await getSiteSettings();

  return (
    // lg:w-85 shrink-0: a flex item shrinks to fit the form, which squeezed
    // the contact box below its 25rem min-width and wrapped the socials. A
    // fixed width keeps the box intact, and the form shrinks instead.
    <aside className="flex flex-col gap-4 lg:w-85 lg:shrink-0">
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
          <a href={settings.instagramUrl} target="_blank" className={linkClass}>
            Instagram
          </a>{" "}
          ·{" "}
          <a href={settings.facebookUrl} target="_blank" className={linkClass}>
            Facebook
          </a>{" "}
          ·{" "}
          <a href={settings.tiktokUrl} target="_blank" className={linkClass}>
            TikTok
          </a>
        </p>
      </div>
      {children}
    </aside>
  );
}

// With cacheComponents, searchParams is runtime data and must be read inside
// <Suspense>. Isolating it here keeps the rest of the page prerendered; only
// the form and the preview stream in. The animal is looked up once and feeds
// both. An unknown or repeated slug is ignored.
async function PrefilledContact({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // we read searchParams only once here, then use its data for both teh ContactForm and the AnimalPreviewCard.
  const { dog: slug } = await searchParams;
  const locale = await getLocale();
  const dog =
    typeof slug === "string" ? await getAnimal(slug, locale) : undefined;

  return (
    <>
      {/* key: useForm only reads defaultValues on mount, so a different dog
          has to remount the form or the previous dog's name would stay in
          the message. */}
      <ContactForm
        key={dog?.slug ?? "no-dog"}
        dogName={dog?.name ?? undefined}
      />
      <ContactAside>
        {dog && <AnimalPreviewCard animal={dog} cardType="contact" />}
      </ContactAside>
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ContactPage.metadata");
  return { title: t("title"), description: t("description") };
}

export default async function Contact({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("ContactPage");

  return (
    <div className="page-container page-section section-stack">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-5xl">{t("heading")}</h1>
      </div>
      {/* Stacked on small screens; side by side from lg. items-start stops the
          box stretching to the form's height, so it only takes what it needs. */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* The fallback is the plain form and the contact details with a
            placeholder, so the layout does not jump. */}
        <Suspense
          fallback={
            <>
              <ContactForm />
              <ContactAside>
                <AnimalPreviewSkeleton />
              </ContactAside>
            </>
          }
        >
          <PrefilledContact searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
