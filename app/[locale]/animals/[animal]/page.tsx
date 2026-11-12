import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CircleQuestionMark, House, PawPrint } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { ageLine } from "@/lib/age";
import { animalDetails, type AnimalKey } from "@/lib/animal-details";
import { getAnimal, getAnimals } from "@/lib/animals";
import HealthIcon from "../../components/HealthIcon";
import SanityImage from "../../components/SanityImage";
import AnimalGallery from "./AnimalGallery";
import AnimalVideos from "./AnimalVideos";

// Opt out of instant-navigation validation (dev-only, never blocks the build).
// Everything on this page depends on `params`, so there is no useful shell to
// show before the animal is known. Streaming it behind Suspense would also
// make an unknown slug answer 200 with the not-found UI instead of a real 404.
// Known animals are prerendered by generateStaticParams below anyway.
export const instant = false;

// Prerender one page per animal and locale at build time. Slugs are the same
// in every locale, so the default locale's list is enough. Animals added
// later are rendered on first visit and then cached.
export async function generateStaticParams() {
  const animals = await getAnimals(routing.defaultLocale);
  // The generated type allows a null slug; a page without one has no URL.
  const slugs = animals.flatMap((animal) => (animal.slug ? [animal.slug] : []));
  const params = routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, animal: slug })),
  );
  // With cacheComponents, an empty list is a build error. Next's documented
  // workaround is a placeholder param, which the page turns into a 404.
  return params.length > 0
    ? params
    : routing.locales.map((locale) => ({ locale, animal: "__placeholder__" }));
}

// Title and description come from the animal itself (CMS content), so a shared
// link to a dog shows that dog's name, text and main photo. An unknown slug
// returns nothing here; the page itself answers with notFound().
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; animal: string }>;
}): Promise<Metadata> {
  const { locale, animal: slug } = await params;
  const animal = await getAnimal(slug, locale);
  if (!animal) return {};
  const t = await getTranslations("AnimalPage");
  const title = t("heading", { name: animal.name ?? "" });
  const photoUrl = animal.gallery?.[0]?.url;
  return {
    title,
    description: animal.description ?? undefined,
    openGraph: {
      title,
      description: animal.description ?? undefined,
      type: "website",
      images: photoUrl ? [{ url: photoUrl }] : undefined,
    },
  };
}

export default async function AnimalPage({
  params,
}: {
  params: Promise<{ locale: string; animal: string }>;
}) {
  const { locale, animal: slug } = await params;

  const animal = await getAnimal(slug, locale);
  if (!animal) notFound();
  const t = await getTranslations("AnimalPage");
  const tAge = await getTranslations("Age");
  const age = ageLine(animal, tAge);
  const tAnimal = await getTranslations("Animal");
  const format = await getFormatter();
  const photo = animal.gallery?.[0];
  // The generated type allows a missing url; such a photo cannot be shown.
  const galleryPhotos = (animal.gallery ?? []).flatMap(
    ({ url, alt, hotspot }) => (url ? [{ url, alt, hotspot }] : []),
  );
  const name = animal.name ?? "";
  const adopted = animal.status === "adopted";

  return (
    <div className="flex flex-col w-full">
      <section className="page-container page-section flex flex-col gap-8 md:flex-row md:items-center">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {(animal.location || animal.status) && (
              <ul className="mb-2 flex gap-1">
                {animal.location && (
                  <li className="pill text-sm text-link">
                    <House aria-hidden="true" className="size-5" />
                    {tAnimal(`location.${animal.location}`)}
                  </li>
                )}
                {animal.status && (
                  <li className="pill text-sm text-link">
                    {tAnimal(`status.${animal.status}`)}
                  </li>
                )}
              </ul>
            )}
            <h1 className="font-heading text-5xl">{t("heading", { name })}</h1>
            {animal.description && (
              <p className="font-body">{animal.description}</p>
            )}
            {/* Only rendered when something is known: an empty list means
                "not recorded", never "not good with anyone". `unit` style:
                the usual "and" form gives the literal "a(n)" in Luxembourgish. */}
            {animal.goodWith && animal.goodWith.length > 0 && (
              <p className="font-body font-bold">
                {t("goodWith", {
                  list: format.list(
                    animal.goodWith.map((value) =>
                      tAnimal(`goodWith.${value}` as AnimalKey),
                    ),
                    { type: "unit" },
                  ),
                })}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              {/* Links have no disabled state, so an adopted animal gets a
                  disabled button that looks the same instead. */}
              {adopted ? (
                <button
                  type="button"
                  disabled
                  className="filled-button font-bold"
                >
                  <PawPrint aria-hidden="true" className="size-5" />
                  {t("adopt", { name })}
                </button>
              ) : (
                <Link
                  href={{ pathname: "/adopt", query: { dog: animal.slug } }}
                  className="filled-button font-bold"
                >
                  <PawPrint aria-hidden="true" className="size-5" />
                  {t("adopt", { name })}
                </Link>
              )}
              <Link
                href={{ pathname: "/contact", query: { dog: animal.slug } }}
                className="outlined-button font-bold"
              >
                <CircleQuestionMark aria-hidden="true" className="size-5" />
                {t("ask", { name })}
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-aside">
          <div className="relative picture-placeholder blob-frame aspect-square w-full">
            {photo?.url && (
              <SanityImage
                src={photo.url}
                // The editor's alt text, else the name: this is the main
                // photo of the page, so it should not be treated as decoration.
                alt={photo.alt ?? name}
                sizes="(min-width: 1024px) 448px, (min-width: 768px) 320px, min(90vw, 448px)"
                hotspot={photo.hotspot}
                // Above the fold and the page's main image, so not lazy.
                eager
              />
            )}
          </div>
          {age && (
            <p className="font-heading text-2xl font-bold">
              {age}
            </p>
          )}
          <p className="text-balance text-center font-heading text-2xl">
            {animalDetails(animal, tAnimal)}
          </p>
        </div>
      </section>

      {animal.health && animal.health.length > 0 && (
        <section className="w-full bg-button">
          <div className="page-container page-section section-stack">
            <h2 className="font-heading text-5xl text-white">
              {t("healthHeading")}
            </h2>
            <div className="animal-status-card-grid">
              {animal.health.map((health) => (
                <div key={health} className="prominent-link-card">
                  <HealthIcon health={health} />
                  <p className="text-xl font-bold">
                    {tAnimal(`health.${health}` as AnimalKey)}
                  </p>
                  <p className="text-sm">
                    {tAnimal(`healthHint.${health}` as AnimalKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* One photo is already the main picture above, so a strip of one adds
          nothing. */}
      {galleryPhotos.length > 1 && (
        <section className="w-full bg-pale">
          <div className="page-container page-section section-stack">
            <h2 className="font-heading text-5xl">{t("galleryHeading")}</h2>
            <AnimalGallery photos={galleryPhotos} name={name} />
          </div>
        </section>
      )}

      {animal.videos && animal.videos.length > 0 && (
        <AnimalVideos videos={animal.videos} name={name} />
      )}
    </div>
  );
}
