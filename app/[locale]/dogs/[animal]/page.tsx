import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import {
  CircleQuestionMark,
  ClipboardPlus,
  House,
  IdCard,
  Microchip,
  PawPrint,
  Syringe,
  Worm,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { ageParts } from "@/lib/age";
import { animalDetails } from "@/lib/animal-details";
import { getAnimal, getAnimals } from "@/lib/animals";
import SanityImage from "../../components/SanityImage";
import AnimalGallery from "./AnimalGallery";

const HEALTH_ICONS: Record<string, LucideIcon> = {
  vaccinated: Syringe,
  microchipped: Microchip,
  dewormed: Worm,
  tested: ClipboardPlus,
  testedCat: ClipboardPlus,
  euPassport: IdCard,
};

// Decorative: the label next to it carries the meaning. An option the map does
// not know yet (e.g. one an editor adds in Sanity) falls back to a generic icon.
function HealthIcon({ health }: { health: string }) {
  const Icon = HEALTH_ICONS[health] ?? ClipboardPlus;
  return <Icon aria-hidden="true" className="size-5" />;
}

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

export default async function AnimalPage({
  params,
}: {
  params: Promise<{ locale: string; animal: string }>;
}) {
  const { locale, animal: slug } = await params;

  const animal = await getAnimal(slug, locale);
  if (!animal) notFound();
  const t = await getTranslations("AnimalPage");
  const age = animal.ageMonths == null ? null : ageParts(animal.ageMonths);
  const tAge = await getTranslations("Age");
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
      <section className="page-container flex flex-col gap-8 pb-8 pt-8 md:flex-row md:items-center">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {(animal.location || animal.status) && (
              <ul className="mb-2 flex gap-1">
                {animal.location && (
                  <li className="animal-info-badge flex items-center gap-1">
                    <House aria-hidden="true" className="size-5" />
                    {tAnimal(`location.${animal.location}`)}
                  </li>
                )}
                {animal.status && (
                  <li className="animal-info-badge">
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
                      tAnimal(`goodWith.${value}`),
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
        {/* An explicit width: as a flex item with auto width, this column
            shrink-wraps its text, and the square photo only gets whatever width
            the text happens to need. */}
        <div className="order-first flex w-full max-w-md flex-col items-center gap-2 md:order-0 md:ml-auto md:w-80 md:shrink-0 lg:w-md">
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
              {tAge(age.unit, { count: age.count })}
            </p>
          )}
          <p className="text-balance text-center font-heading text-2xl">
            {animalDetails(animal, tAnimal)}
          </p>
        </div>
      </section>

      {animal.health && animal.health.length > 0 && (
        <section className="w-full bg-button">
          <div className="page-container flex flex-col gap-1 pt-8 pb-8">
            <h2 className="font-heading text-5xl text-white">
              {t("healthHeading")}
            </h2>
            <div className="animal-status-card-grid mt-4">
              {animal.health.map((health) => (
                <div key={health} className="animal-status-card">
                  <HealthIcon health={health} />
                  <p className="text-xl font-bold">
                    {tAnimal(`health.${health}`)}
                  </p>
                  <p className="text-sm">{tAnimal(`healthHint.${health}`)}</p>
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
          <div className="page-container flex flex-col gap-4 pt-8 pb-8">
            <h2 className="font-heading text-5xl">{t("galleryHeading")}</h2>
            <AnimalGallery photos={galleryPhotos} name={name} />
          </div>
        </section>
      )}
    </div>
  );
}
