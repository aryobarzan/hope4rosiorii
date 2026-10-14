"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Animal } from "@/lib/animals";
import AnimalCard from "../components/AnimalCard";

export type SpeciesFilter = "all" | "dog" | "cat";

// The species filter lives in the URL (?species=cat), so a filtered view can be
// shared. Reading search params needs <Suspense> with cacheComponents; the page
// supplies the unfiltered list as the fallback, so the first paint is real
// content and not an empty shell.
export function FilteredAnimalList({ animals }: { animals: Animal[] }) {
  const param = useSearchParams().get("species");
  const species: SpeciesFilter =
    param === "dog" || param === "cat" ? param : "all";
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

  const hasBothSpecies = new Set(animals.map((a) => a.species)).size > 1;
  const visible =
    species === "all" ? animals : animals.filter((a) => a.species === species);

  return (
    <>
      {hasBothSpecies && (
        <nav
          aria-label={t("filter.label")}
          className="flex flex-wrap gap-2"
        >
          {(["all", "dog", "cat"] as const).map((value) => (
            <Link
              key={value}
              href={
                value === "all"
                  ? "/animals"
                  : { pathname: "/animals", query: { species: value } }
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
      {visible.length === 0 && <p>{t("empty")}</p>}
      <ul className="dog-grid">
        {visible.map((animal) => (
          <AnimalCard key={animal._id} animal={animal} />
        ))}
      </ul>
    </>
  );
}
