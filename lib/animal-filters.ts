// Filters for the animals listing. They live in the URL
// (?species=dog&size=small&age=baby), so a filtered view can be shared. This
// file is plain TypeScript with no React, so the same rules can be reused
// anywhere.
import type { Animal } from "@/lib/animals";

export const SPECIES = ["dog", "cat"] as const;
export const SIZES = ["small", "medium", "large"] as const;
// Age bands, by estimated age: baby under 1 year, young 1 to under 3 years,
// adult 3 years and older. Change the limits in ageBand() only.
export const AGES = ["baby", "young", "adult"] as const;

type Option<T extends readonly string[]> = "all" | T[number];
export type SpeciesFilter = Option<typeof SPECIES>;
export type SizeFilter = Option<typeof SIZES>;
export type AgeFilter = Option<typeof AGES>;

export type Filters = {
  species: SpeciesFilter;
  size: SizeFilter;
  age: AgeFilter;
};

export const noFilters: Filters = { species: "all", size: "all", age: "all" };

// Anything that is not a known value (typos, old links) counts as "all"
function pick<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | "all" {
  return allowed.find((option) => option === value) ?? "all";
}

export function parseFilters(params: {
  get(name: string): string | null;
}): Filters {
  return {
    species: pick(params.get("species"), SPECIES),
    size: pick(params.get("size"), SIZES),
    age: pick(params.get("age"), AGES),
  };
}

export function ageBand(months: number): (typeof AGES)[number] {
  if (months < 12) return "baby";
  if (months < 36) return "young";
  return "adult";
}

// The studio lets editors pick one size or two, meaning a range ("medium to
// large"). An animal matches every size inside its range. Animals without a
// size (cats) never match a size filter.
function matchesSize(animal: Animal, size: (typeof SIZES)[number]): boolean {
  const indexes = (animal.size ?? [])
    .map((value) => (SIZES as readonly string[]).indexOf(value))
    .filter((index) => index >= 0);
  if (indexes.length === 0) return false;
  const wanted = SIZES.indexOf(size);
  return Math.min(...indexes) <= wanted && wanted <= Math.max(...indexes);
}

export function filterAnimals(animals: Animal[], filters: Filters): Animal[] {
  return animals.filter(
    (animal) =>
      (filters.species === "all" || animal.species === filters.species) &&
      (filters.size === "all" || matchesSize(animal, filters.size)) &&
      (filters.age === "all" ||
        (animal.ageMonths !== null && ageBand(animal.ageMonths) === filters.age)),
  );
}

export function hasActiveFilters(filters: Filters): boolean {
  return Object.values(filters).some((value) => value !== "all");
}

// Link target for a set of filters. "all" is left out of the URL, so the
// unfiltered page keeps the plain /animals address.
export function filtersHref(filters: Filters) {
  const query = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== "all"),
  );
  return Object.keys(query).length === 0
    ? "/animals"
    : { pathname: "/animals", query };
}
