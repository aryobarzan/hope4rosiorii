import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { getCountryOptions } from "@/lib/countries";
import { getAnimal } from "@/lib/animals";
import AnimalPreviewCard from "../components/AnimalPreviewCard";
import AnimalPreviewSkeleton from "../components/AnimalPreviewSkeleton";
import AdoptForm from "./AdoptForm";

const stepClass = "pill size-8 shrink-0 p-0 font-heading text-xl";

type SearchParams = Promise<{ dog?: string | string[] }>;

// Sidebar next to the form: what happens next, plus the animal preview when
// there is one. An <aside> because it complements the form rather than being
// part of it. Fixed width from lg up so the form shrinks instead of the box.
async function AdoptAside({ children }: { children?: ReactNode }) {
  const t = await getTranslations("AdoptPage");

  return (
    <aside className="flex flex-col gap-4 lg:w-100 lg:shrink-0">
      <div className="flex flex-col gap-2 prominent-box">
        <p className="font-heading text-2xl">{t("next.heading")}</p>
        <span className="flex gap-2">
          <span className={stepClass}>1</span>{" "}
          <p className="font-body">{t("next.step1")}</p>
        </span>
        <span className="flex gap-2">
          <span className={stepClass}>2</span>{" "}
          <p className="font-body">{t("next.step2")}</p>
        </span>
        <span className="flex gap-2">
          <span className={stepClass}>3</span>{" "}
          <p className="font-body">{t("next.step3")}</p>
        </span>
      </div>
      {children}
    </aside>
  );
}

// With cacheComponents, searchParams is runtime data and must be read inside
// <Suspense>. Isolating it here keeps the rest of the page prerendered; only
// the form and the preview stream in. The animal is looked up once and feeds
// both. An unknown or repeated slug is ignored.
async function PrefilledAdopt({
  searchParams,
  countries,
}: {
  searchParams: SearchParams;
  countries: ReturnType<typeof getCountryOptions>;
}) {
  const { dog: slug } = await searchParams;
  const locale = await getLocale();
  const dog =
    typeof slug === "string" ? await getAnimal(slug, locale) : undefined;

  return (
    <>
      {/* key: useForm only reads defaultValues on mount, so a different dog
          has to remount the form or the previous dog's name would stay in
          the field. */}
      <AdoptForm
        key={dog?.slug ?? "no-dog"}
        countries={countries}
        dogName={dog?.name ?? undefined}
      />
      <AdoptAside>
        {dog && <AnimalPreviewCard animal={dog} cardType="adoption" />}
      </AdoptAside>
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdoptPage.metadata");
  return { title: t("title"), description: t("description") };
}

export default async function Adopt({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("AdoptPage");
  const locale = await getLocale();
  const countries = getCountryOptions(locale);

  return (
    <div className="page-container page-section section-stack">
      <div className="flex flex-col gap-1">
        <p className="font-heading text-xl text-link">{t("eyebrow")}</p>
        <h1 className="font-heading text-5xl">{t("heading")}</h1>
      </div>
      {/* Stacked on small screens; side by side from lg. items-start stops the
          box stretching to the form's height, so it only takes what it needs. */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* The fallback is the plain form and the next-steps box with a
            placeholder, so the layout does not jump. */}
        <Suspense
          fallback={
            <>
              <AdoptForm countries={countries} />
              <AdoptAside>
                <AnimalPreviewSkeleton />
              </AdoptAside>
            </>
          }
        >
          <PrefilledAdopt searchParams={searchParams} countries={countries} />
        </Suspense>
      </div>
    </div>
  );
}
