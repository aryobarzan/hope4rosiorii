import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getAnimals, happyEndings } from "@/lib/animals";
import HappyEndingCard from "./HappyEndingCard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("HappyEndingsPage.metadata");
  return { title: t("title"), description: t("description") };
}

// No filters on purpose: the page is for browsing, and the list is short.
// If it ever grows past a few dozen, a "show more" button will be introduced.
export default async function HappyEndings() {
  const t = await getTranslations("HappyEndingsPage");
  const locale = await getLocale();
  const animals = happyEndings(await getAnimals(locale));
  return (
    <div className="page-container page-section section-stack">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-5xl">{t("title")}</h1>
        <p>{t("intro")}</p>
      </div>
      {animals.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <ul className="dog-grid">
          {animals.map((animal) => (
            <HappyEndingCard key={animal._id} animal={animal} />
          ))}
        </ul>
      )}
    </div>
  );
}
