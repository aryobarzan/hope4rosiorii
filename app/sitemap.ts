import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAnimals } from "@/lib/animals";
import { siteUrl } from "@/lib/site-url";

// Paths are the same in every locale (no localized pathnames in i18n/routing),
// and locale prefixes are always present. "" is the home page.
const staticPaths = [
  "",
  "/animals",
  "/adopt",
  "/about",
  "/contact",
  "/donate",
  "/privacy-policy",
];

// One entry per locale, each pointing at all of its language versions. Search
// engines use `alternates` to show the right language to each visitor.
function entries(path: string): MetadataRoute.Sitemap {
  const urlFor = (locale: string) => `${siteUrl}/${locale}${path}`;
  const languages = {
    ...Object.fromEntries(routing.locales.map((l) => [l, urlFor(l)])),
    "x-default": urlFor(routing.defaultLocale),
  };
  return routing.locales.map((locale) => ({
    url: urlFor(locale),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Slugs are the same in every locale, so the default locale's list is enough
  // (the animal detail page's generateStaticParams does the same)
  const animals = await getAnimals(routing.defaultLocale);
  const animalPaths = animals.flatMap((animal) =>
    animal.slug ? [`/animals/${animal.slug}`] : [],
  );

  return [...staticPaths, ...animalPaths].flatMap(entries);
}
