"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PawPrint, CircleQuestionMark } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ageParts } from "@/lib/age";
import type { Animal } from "@/lib/animals";
import { hotspotPosition, sanityImageLoader } from "@/lib/sanity/image";

const adoptBadge = "text-link font-bold font-heading text-xl";
const adoptedBadge =
  "bg-white rounded-full text-link px-2 font-bold font-heading text-xl";

const SIZE_ORDER = ["small", "medium", "large"];
const MAX_TRAITS_ON_CARD = 2;

export type SpeciesFilter = "all" | "dog" | "cat";

// The species filter lives in the URL (?species=cat), so a filtered view can be
// shared. Reading search params needs <Suspense> with cacheComponents; the page
// supplies the unfiltered list as the fallback, so the first paint is real
// content and not an empty shell.
export function FilteredAnimalList({ animals }: { animals: Animal[] }) {
  const param = useSearchParams().get("species");
  const species: SpeciesFilter = param === "dog" || param === "cat" ? param : "all";
  return <AnimalList animals={animals} species={species} />;
}

export function AnimalList({
  animals,
  species,
}: {
  animals: Animal[];
  species: SpeciesFilter;
}) {
  const t = useTranslations("DogsPage");
  const tAnimal = useTranslations("Animal");
  const tAge = useTranslations("Age");

  const hasBothSpecies = new Set(animals.map((a) => a.species)).size > 1;
  const visible =
    species === "all" ? animals : animals.filter((a) => a.species === species);

  function details(animal: Animal) {
    const parts: string[] = [];
    if (animal.gender) parts.push(tAnimal(`gender.${animal.gender}`));
    // Size is only asked for dogs.
    if (animal.species === "dog" && animal.size?.length) {
      const sizes = animal.size.toSorted(
        (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b),
      );
      parts.push(
        sizes.length > 1
          ? tAnimal("sizeRange", {
              from: tAnimal(`size.${sizes[0]}`),
              to: tAnimal(`size.${sizes[sizes.length - 1]}`),
            })
          : tAnimal(`size.${sizes[0]}`),
      );
    }
    for (const trait of (animal.traits ?? []).slice(0, MAX_TRAITS_ON_CARD)) {
      parts.push(tAnimal(`traits.${trait}`));
    }
    return parts.join(" • ");
  }

  return (
    <>
      {hasBothSpecies && (
        <nav aria-label={t("filter.label")} className="flex flex-wrap gap-2 pt-4">
          {(["all", "dog", "cat"] as const).map((value) => (
            <Link
              key={value}
              href={
                value === "all"
                  ? "/dogs"
                  : { pathname: "/dogs", query: { species: value } }
              }
              scroll={false}
              aria-current={species === value ? "true" : undefined}
              className={`${species === value ? "filled-button" : "outlined-button"} font-bold`}
            >
              {t(`filter.${value}`)}
            </Link>
          ))}
        </nav>
      )}
      {visible.length === 0 && <p className="pt-4">{t("empty")}</p>}
      <ul className="dog-grid pt-4">
        {visible.map((animal) => {
          const adopted = animal.status === "adopted";
          const photo = animal.gallery?.[0];
          const age =
            animal.ageMonths == null ? null : ageParts(animal.ageMonths);
          return (
            <li key={animal._id} className="dog-card" data-adopted={adopted}>
              <p className={adopted ? adoptedBadge : adoptBadge}>
                {adopted ? t("card.adopted") : t("card.adoptMe")}
              </p>
              <p className="font-heading text-4xl font-bold">{animal.name}</p>

              {/* Fills the card up to 18rem and stays square. A fixed w-72 overflowed
                  cards narrower than 288px (e.g. on phones). Without a photo the
                  coloured placeholder stays. */}
              <div
                className={`relative picture-placeholder blob-frame aspect-square w-full max-w-72 ${photo || !adopted ? `` : `bg-link`}`}
              >
                {photo?.url && (
                  <Image
                    loader={sanityImageLoader}
                    src={photo.url}
                    alt={photo.alt ?? ""}
                    fill
                    sizes="(min-width: 640px) 288px, 90vw"
                    className="object-cover"
                    style={{ objectPosition: hotspotPosition(photo.hotspot) }}
                  />
                )}
              </div>
              {age && (
                <p className="font-heading text-2xl font-bold">
                  {tAge(age.unit, { count: age.count })}
                </p>
              )}
              {/* The card's align-items: center centres this paragraph's box, not
                  the text inside it. text-center centres each wrapped line, and
                  text-balance evens out the line lengths, so a wrap does not
                  leave one long line and a single orphaned word. */}
              <p className="text-balance text-center font-heading text-2xl">
                {details(animal)}
              </p>
              {animal.description && (
                <p className="font-body">{animal.description}</p>
              )}
              {/* mt-auto: an automatic top margin takes all the free space in this
                  flex column, which pushes the button to the card's bottom edge
                  (cards in a row are equally tall), even without a description. */}
              {!adopted && (
                <div className="mt-auto flex w-full flex-col gap-1">
                  <Link
                    href={{ pathname: "/contact", query: { dog: animal.slug } }}
                    className="outlined-button font-bold"
                  >
                    <CircleQuestionMark aria-hidden="true" className="size-5" />
                    {t("card.ask", { name: animal.name ?? "" })}
                  </Link>
                  <Link
                    href={{ pathname: "/adopt", query: { dog: animal.slug } }}
                    className="filled-button font-bold"
                  >
                    <PawPrint aria-hidden="true" className="size-5" />
                    {t("card.adopt", { name: animal.name ?? "" })}
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
