import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAnimals } from "@/lib/animals";
import { AnimalList, FilteredAnimalList } from "./AnimalList";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("DogsPage.metadata");
  return { title: t("title"), description: t("description") };
}

export default async function Dogs() {
  const t = await getTranslations("DogsPage");
  const locale = await getLocale();
  const animals = await getAnimals(locale);
  // Adoptable animals first, adopted ones last
  const sorted = animals.toSorted(
    (a, b) =>
      Number(a.status === "adopted") - Number(b.status === "adopted"),
  );
  return (
    <div className="page-container flex flex-col gap-1 pb-8 pt-8">
      <p className="font-heading text-xl text-link">{t("eyebrow")}</p>
      <h1 className="font-heading text-5xl">{t("heading")}</h1>
      <p>{t("description")}</p>
      <Suspense fallback={<AnimalList animals={sorted} species="all" />}>
        <FilteredAnimalList animals={sorted} />
      </Suspense>
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-pale text-ink rounded-4xl px-6 py-6 mt-8">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-2xl font-heading">{t("help.title")}</p>
          <p>{t("help.body")}</p>
        </div>
        <Link
          href="/adopt"
          className="filled-button filled-button-ink font-bold ml-auto shrink-0"
        >
          {t("help.cta")}
        </Link>
      </div>
    </div>
  );
}

// TODO: additional animal info (health, good with, location, adoption note,
// video) / separate animal-specific page
// TODO: animal selected preview in contact / adopt pages
