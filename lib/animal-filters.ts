// Filters for the animals listing. They live in the URL
// (?species=cat&age=junior), so a filtered view can be shared. This file is
// plain TypeScript with no React, so the same rules can be reused anywhere.
import type { Animal } from "@/lib/animals";

export const SPECIES = ["dog", "cat"] as const;
export const SIZES = ["small", "medium", "large"] as const;

export type Species = (typeof SPECIES)[number];
// The species shown when the address names none. It is left out of the URL.
export const DEFAULT_SPECIES: Species = "dog";

// Named life stages, youngest first. Dogs and cats age differently, so each
// species has its own list, and the age filter only offers the active
// species' stages.
export const AGES = {
  dog: ["puppy", "juvenile", "youngAdult", "matureAdult", "senior"],
  cat: ["kitten", "junior", "adult", "mature", "senior", "superSenior"],
} as const satisfies Record<Species, readonly string[]>;

// The age in months at which each stage ENDS, in the same order as AGES. The
// last stage has no end, so it has no limit. These are the only numbers to
// change if the team wants other boundaries. They are the volunteers' ranges,
// read as continuous: "mature adult 2 to 6 years" runs until the 7th birthday,
// where "senior 7 to 11" starts, and so on. Age is in whole months, so
// "kitten, birth to 6 months" ends once a cat reaches 7 months.
const AGE_LIMITS = {
  dog: [6, 12, 24, 84], // puppy <6 mo, juvenile <1 y, young adult <2 y, mature adult <7 y; senior from 7 y (open-ended)
  cat: [7, 36, 84, 132, 180], // kitten <7 mo, junior <3 y, adult <7 y, mature <11 y, senior <15 y; super senior from 15 y
} as const satisfies Record<Species, readonly number[]>;

type Option<T extends readonly string[]> = "all" | T[number];
export type SizeFilter = Option<typeof SIZES>;
export type AgeStage = (typeof AGES)[Species][number];
export type AgeFilter = "all" | AgeStage;

// A species is always chosen (there is no "all"), so each one can show its own
// age stages.
export type Filters = {
  species: Species;
  size: SizeFilter;
  age: AgeFilter;
};

export const noFilters: Filters = {
  species: DEFAULT_SPECIES,
  size: "all",
  age: "all",
};

// Anything that is not a known value (typos, old links) falls back
function pick<T extends string, F>(
  value: string | null,
  allowed: readonly T[],
  fallback: F,
): T | F {
  return allowed.find((option) => option === value) ?? fallback;
}

export function parseFilters(params: {
  get(name: string): string | null;
}): Filters {
  const species = pick(params.get("species"), SPECIES, DEFAULT_SPECIES);
  return {
    species,
    size: pick(params.get("size"), SIZES, "all"),
    // Checked against this species' stages: ?species=dog&age=kitten is ignored
    age: pick<AgeStage, "all">(params.get("age"), AGES[species], "all"),
  };
}

export function ageBand(species: Species, months: number): AgeStage {
  const stages: readonly AgeStage[] = AGES[species];
  const limits: readonly number[] = AGE_LIMITS[species];
  const index = limits.findIndex((limit) => months < limit);
  return stages[index === -1 ? stages.length - 1 : index];
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
      animal.species === filters.species &&
      (filters.size === "all" || matchesSize(animal, filters.size)) &&
      (filters.age === "all" ||
        (animal.ageMonths !== null &&
          ageBand(filters.species, animal.ageMonths) === filters.age)),
  );
}

// A species with no animals is a dead end, and when only one species exists
// the species buttons are hidden. So if the chosen species has no animals and
// the other one has, show the other one (with size and age reset, as they
// belonged to the first).
export function resolveSpecies(animals: Animal[], filters: Filters): Filters {
  const present = new Set(animals.map((animal) => animal.species));
  if (present.has(filters.species)) return filters;
  const other = SPECIES.find((species) => present.has(species));
  return other ? { ...filters, species: other, size: "all", age: "all" } : filters;
}

// The species always counts as chosen, so only size and age make a view
// "filtered".
export function hasActiveFilters(filters: Filters): boolean {
  return filters.size !== "all" || filters.age !== "all";
}

// Link target for a set of filters. Default values ("all", and the default
// species) are left out of the URL, so the unfiltered page keeps the plain
// /animals address.
export function filtersHref(filters: Filters) {
  const query = Object.fromEntries(
    Object.entries(filters).filter(
      ([name, value]) =>
        value !== "all" && !(name === "species" && value === DEFAULT_SPECIES),
    ),
  );
  return Object.keys(query).length === 0
    ? "/animals"
    : { pathname: "/animals", query };
}
