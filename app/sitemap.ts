import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAnimals } from "@/lib/animals";
import { siteUrl } from "@/lib/site-url";
import { getEvents } from "@/lib/events";
import { getPosts } from "@/lib/posts";

// Paths are the same in every locale (no localized pathnames in i18n/routing),
// and locale prefixes are always present. "" is the home page.
const staticPaths = [
  "",
  "/animals",
  "/happy-endings",
  "/events",
  "/adopt",
  "/news",
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
  // Animals
  const animals = await getAnimals(routing.defaultLocale);
  const animalPaths = animals.flatMap((animal) =>
    animal.slug ? [`/animals/${animal.slug}`] : [],
  );
  // Events
  const events = await getEvents(routing.defaultLocale);
  // we leave out cancelled events.
  const eventPaths = events.flatMap((event) =>
    event.slug && !event.cancelled ? [`/events/${event.slug}`] : [],
  );

  // News posts
  const news = await getPosts(routing.defaultLocale);
  const newsPaths = news.flatMap((post) =>
    post.slug ? [`/news/${post.slug}`] : [],
  );

  return [...staticPaths, ...animalPaths, ...eventPaths, ...newsPaths].flatMap(
    entries,
  );
}
