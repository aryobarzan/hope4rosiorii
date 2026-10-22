"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { Animal } from "@/lib/animals";
import {
  AGES,
  SIZES,
  SPECIES,
  type Filters,
  filterAnimals,
  filtersHref,
  hasActiveFilters,
  parseFilters,
} from "@/lib/animal-filters";
import AnimalCard from "../components/AnimalCard";

// The filters live in the URL (?species=cat&size=small), so a filtered view can
// be shared. Reading search params needs <Suspense> with cacheComponents; the
// page supplies the unfiltered list as the fallback, so the first paint is real
// content and not an empty shell.
export function FilteredAnimalList({ animals }: { animals: Animal[] }) {
  return <AnimalList animals={animals} filters={parseFilters(useSearchParams())} />;
}

// The filters after choosing `value` in group `name`; the other groups keep
// their choice.
function withFilter(filters: Filters, name: keyof Filters, value: string) {
  return {
    ...filters,
    [name]: value,
    // Cats have no size, so a size left over from before would hide them all
    ...(name === "species" && value === "cat" && { size: "all" }),
  } as Filters;
}

// One filter group, shown two ways: a row of links ("Show: All Dogs Cats") from
// the sm breakpoint up, and a single dropdown button below it, where a row of
// three groups would take most of the screen. Both change the same URL.
function FilterGroup({
  label,
  name,
  values,
  labelFor,
  filters,
}: {
  label: string;
  name: keyof Filters;
  values: readonly string[];
  labelFor: (value: string) => string;
  filters: Filters;
}) {
  const t = useTranslations("DogsPage");
  const router = useRouter();

  // "All" is shared by every group, so labelFor only sees real values
  const options = ["all", ...values].map((value) => ({
    value,
    text: value === "all" ? t("filter.all") : labelFor(value),
  }));
  const current = options.find((option) => option.value === filters[name]);
  const isActive = filters[name] !== "all";

  return (
    <>
      <nav
        aria-label={label}
        className="hidden flex-wrap items-center gap-2 sm:flex"
      >
        <span aria-hidden="true" className="font-bold">
          {label}
        </span>
        {options.map(({ value, text }) => {
          const selected = filters[name] === value;
          return (
            <Link
              key={value}
              href={filtersHref(withFilter(filters, name, value))}
              scroll={false}
              aria-current={selected ? "true" : undefined}
              // .filled-button has no border, .outlined-button has 1.5px. A
              // transparent border of the same width keeps both the same size.
              className={`${selected ? "filled-button border-[1.5px] border-solid border-transparent" : "outlined-button"} font-bold`}
            >
              {text}
            </Link>
          );
        })}
      </nav>

      {/* Same idea as LanguageSwitcher: a real <select> sits invisibly on top of
          a styled pill, so keyboard, screen readers and the phone's native
          picker all work. The pill shows the group and its current choice. */}
      <div
        className={`relative inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-button px-4 font-bold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink sm:hidden ${
          // Hover mirrors the link buttons: outlined fills in, filled darkens
          isActive
            ? "bg-button text-white hover:bg-[color-mix(in_srgb,var(--color-button),black_15%)]"
            : "text-link hover:bg-button hover:text-white"
        }`}
      >
        <span aria-hidden="true">
          {isActive ? `${label}: ${current?.text}` : label}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-4 fill-none stroke-current stroke-2"
        >
          <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <select
          aria-label={label}
          value={filters[name]}
          onChange={(e) =>
            router.push(filtersHref(withFilter(filters, name, e.target.value)), {
              scroll: false,
            })
          }
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        >
          {options.map(({ value, text }) => (
            <option key={value} value={value} className="bg-card text-ink">
              {text}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

export function AnimalList({
  animals,
  filters,
}: {
  animals: Animal[];
  filters: Filters;
}) {
  const t = useTranslations("DogsPage");

  // A filter group only appears when it can change the result
  const hasBothSpecies = new Set(animals.map((a) => a.species)).size > 1;
  const hasSizes =
    filters.species !== "cat" && animals.some((a) => a.size?.length);
  const hasAges = animals.some((a) => a.ageMonths !== null);

  const visible = filterAnimals(animals, filters);

  return (
    <>
      {(hasBothSpecies || hasSizes || hasAges) && (
        // Below sm the groups are dropdown pills side by side; from sm up each
        // group is its own row of links
        <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-3">
          {hasBothSpecies && (
            <FilterGroup
              label={t("filter.label")}
              name="species"
              values={SPECIES}
              labelFor={(value) => t(`filter.${value as "dog" | "cat"}`)}
              filters={filters}
            />
          )}
          {hasSizes && (
            <FilterGroup
              label={t("filter.sizeLabel")}
              name="size"
              values={SIZES}
              labelFor={(value) => t(`filter.size.${value as (typeof SIZES)[number]}`)}
              filters={filters}
            />
          )}
          {hasAges && (
            <FilterGroup
              label={t("filter.ageLabel")}
              name="age"
              values={AGES}
              labelFor={(value) => t(`filter.age.${value as (typeof AGES)[number]}`)}
              filters={filters}
            />
          )}
        </div>
      )}
      {visible.length === 0 && (
        <p>{hasActiveFilters(filters) ? t("noMatch") : t("empty")}</p>
      )}
      <ul className="dog-grid">
        {visible.map((animal) => (
          <AnimalCard key={animal._id} animal={animal} />
        ))}
      </ul>
    </>
  );
}
