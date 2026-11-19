import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { adoptable, getAnimals } from "@/lib/animals";
import { noFilters } from "@/lib/animal-filters";
import { AnimalList, FilteredAnimalList } from "./AnimalList";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("DogsPage.metadata");
  return { title: t("title"), description: t("description") };
}

export default async function Dogs() {
  const t = await getTranslations("DogsPage");
  const locale = await getLocale();
  // Adopted animals live on the Happy Endings page
  const animals = adoptable(await getAnimals(locale));
  return (
    <div className="page-container page-section section-stack">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-5xl">{t("heading")}</h1>
        <p>{t("description")}</p>
      </div>
      <Suspense fallback={<AnimalList animals={animals} filters={noFilters} />}>
        <FilteredAnimalList animals={animals} />
      </Suspense>
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-pale text-ink rounded-4xl p-(--card-padding)">
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
