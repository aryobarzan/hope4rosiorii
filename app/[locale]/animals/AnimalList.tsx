"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Animal } from "@/lib/animals";
import type { AnimalKey } from "@/lib/animal-details";
import {
  AGES,
  GENDERS,
  NEEDS_ANY,
  SIZES,
  SPECIES,
  type AgeStage,
  type Filters,
  availableNeeds,
  filterAnimals,
  filtersHref,
  hasActiveFilters,
  parseFilters,
  resolveSpecies,
} from "@/lib/animal-filters";
import AnimalCard from "../components/AnimalCard";
import FilterSheet from "./FilterSheet";
import NeedsFilter from "./NeedsFilter";

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
    // Size, age stages and special needs depend on the species (cats have no
    // size, dogs and cats have different age stages, and each has its own
    // needs), so a choice left over from the other species could hide every
    // animal
    ...(name === "species" && { size: "all", age: "all", gender: "all", needs: [] }),
  } as Filters;
}

// The species choice: a row of links ("Show: Dogs Cats") above the list on
// every screen size. One species is always chosen, so there is no "All".
function SpeciesPills({ filters }: { filters: Filters }) {
  const t = useTranslations("DogsPage");
  return (
    <nav aria-label={t("filter.label")} className="flex flex-wrap items-center gap-2">
      <span aria-hidden="true" className="font-bold">
        {t("filter.label")}
      </span>
      {SPECIES.map((value) => {
        const selected = filters.species === value;
        return (
          <Link
            key={value}
            href={filtersHref(withFilter(filters, "species", value))}
            scroll={false}
            aria-current={selected ? "true" : undefined}
            // .filled-button has no border, .outlined-button has 1.5px. A
            // transparent border of the same width keeps both the same size.
            className={`${selected ? "filled-button border-[1.5px] border-solid border-transparent" : "outlined-button"} font-bold`}
          >
            {t(`filter.${value}`)}
          </Link>
        );
      })}
    </nav>
  );
}

// One single-choice filter group (size, age) as a vertical list of links, with
// "All" first. Links, not inputs, so it works without JavaScript and every
// choice is a shareable address. The selected option has a filled marker and
// aria-current, so it is not shown by colour alone.
function FilterOptions({
  label,
  name,
  values,
  labelFor,
  filters,
}: {
  label: string;
  name: "size" | "age" | "gender";
  values: readonly string[];
  labelFor: (value: string) => string;
  filters: Filters;
}) {
  const t = useTranslations("DogsPage");
  const options = ["all", ...values].map((value) => ({
    value,
    text: value === "all" ? t("filter.all") : labelFor(value),
  }));

  return (
    <nav aria-label={label} className="flex flex-col gap-1">
      <p aria-hidden="true" className="font-bold">
        {label}
      </p>
      {options.map(({ value, text }) => {
        const selected = filters[name] === value;
        return (
          <Link
            key={value}
            href={filtersHref(withFilter(filters, name, value))}
            scroll={false}
            aria-current={selected ? "true" : undefined}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 hover:bg-pale active:bg-[color-mix(in_srgb,var(--color-pale),var(--color-ink)_12%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <span
              aria-hidden="true"
              className={`size-4 shrink-0 rounded-full border-2 border-button ${selected ? "bg-button shadow-[inset_0_0_0_2px_white]" : ""}`}
            />
            <span className={selected ? "font-bold" : undefined}>{text}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AnimalList({
  animals,
  filters: requested,
}: {
  animals: Animal[];
  filters: Filters;
}) {
  const t = useTranslations("DogsPage");
  const tAge = useTranslations("Age");
  const tAnimal = useTranslations("Animal");
  // If the default species (dogs) has no animals but cats do, show the cats
  const filters = resolveSpecies(animals, requested);

  // A filter group only appears when it can change the result
  const hasBothSpecies = new Set(animals.map((a) => a.species)).size > 1;
  const hasSizes =
    filters.species === "dog" && animals.some((a) => a.size?.length);
  const hasAges = animals.some(
    (a) => a.species === filters.species && a.ageMonths !== null,
  );
  // Only the needs some animal of this species has; a need named in the
  // address stays so it can be cleared
  const offeredNeeds = availableNeeds(animals, filters.species);
  const hasNeeds = offeredNeeds.length > 0 || filters.needs.length > 0;
  // Gender is only worth filtering when the species has both
  const hasGenders =
    new Set(
      animals.filter((a) => a.species === filters.species).map((a) => a.gender),
    ).size > 1 || filters.gender !== "all";
  const hasPanel = hasSizes || hasAges || hasGenders || hasNeeds;

  const visible = filterAnimals(animals, filters);

  const sizeText = (value: string) =>
    t(`filter.size.${value as (typeof SIZES)[number]}`);
  const ageText = (value: string) => tAge(`stage.${value as AgeStage}`);
  const genderText = (value: string) =>
    tAnimal(`gender.${value as (typeof GENDERS)[number]}`);

  // The panel's groups, shared by the sidebar and the mobile sheet
  const options = (
    <>
      {hasSizes && (
        <FilterOptions
          label={t("filter.sizeLabel")}
          name="size"
          values={SIZES}
          labelFor={sizeText}
          filters={filters}
        />
      )}
      {hasAges && (
        <FilterOptions
          label={t("filter.ageLabel")}
          name="age"
          values={AGES[filters.species]}
          labelFor={ageText}
          filters={filters}
        />
      )}
      {hasGenders && (
        <FilterOptions
          label={t("filter.genderLabel")}
          name="gender"
          values={GENDERS}
          labelFor={genderText}
          filters={filters}
        />
      )}
      {hasNeeds && <NeedsFilter filters={filters} available={offeredNeeds} />}
    </>
  );

  // One removable chip per active filter (and per specific need), so the
  // choices stay visible while the panel is closed. Each knows the address
  // that results from removing it.
  const chips: { key: string; text: string; href: ReturnType<typeof filtersHref> }[] = [];
  if (filters.size !== "all") {
    chips.push({
      key: "size",
      text: `${t("filter.sizeLabel")}: ${sizeText(filters.size)}`,
      href: filtersHref(withFilter(filters, "size", "all")),
    });
  }
  if (filters.age !== "all") {
    chips.push({
      key: "age",
      text: `${t("filter.ageLabel")}: ${ageText(filters.age)}`,
      href: filtersHref(withFilter(filters, "age", "all")),
    });
  }
  if (filters.gender !== "all") {
    chips.push({
      key: "gender",
      text: `${t("filter.genderLabel")}: ${genderText(filters.gender)}`,
      href: filtersHref(withFilter(filters, "gender", "all")),
    });
  }
  for (const need of filters.needs) {
    chips.push({
      key: `needs-${need}`,
      text:
        need === NEEDS_ANY
          ? t("filter.needsAny")
          : tAnimal(`specialNeeds.${need}` as AnimalKey),
      href: filtersHref({
        ...filters,
        needs: filters.needs.filter((value) => value !== need),
      }),
    });
  }

  return (
    <div className="section-stack">
      {(hasBothSpecies || hasPanel) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {hasBothSpecies && <SpeciesPills filters={filters} />}
          {hasPanel && (
            <FilterSheet activeCount={chips.length} resultCount={visible.length}>
              {options}
            </FilterSheet>
          )}
        </div>
      )}
      <div
        className={
          hasPanel
            ? "section-stack lg:grid lg:grid-cols-[19rem_1fr] lg:items-start lg:gap-8"
            : "section-stack"
        }
      >
        {hasPanel && (
          // From lg up the panel is a sticky sidebar (below the sticky header);
          // below it, the same groups live in the sheet
          <aside
            aria-label={t("filter.title")}
            className="hidden flex-col gap-4 rounded-3xl bg-card p-5 lg:sticky lg:top-24 lg:flex"
          >
            <h2 className="font-heading text-3xl">{t("filter.title")}</h2>
            {options}
          </aside>
        )}
        <div className="section-stack">
          {chips.length > 0 && (
            <ul
              aria-label={t("filter.active")}
              className="flex flex-wrap items-center gap-2"
            >
              {chips.map((chip) => (
                <li key={chip.key}>
                  <Link
                    href={chip.href}
                    scroll={false}
                    aria-label={t("filter.remove", { name: chip.text })}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-pale px-4 font-bold hover:bg-blush active:bg-[color-mix(in_srgb,var(--color-blush),var(--color-ink)_15%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {chip.text}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="size-4 fill-none stroke-current stroke-2"
                    >
                      <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
                    </svg>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={filtersHref({
                    ...filters,
                    size: "all",
                    age: "all",
                    gender: "all",
                    needs: [],
                  })}
                  scroll={false}
                  className="inline-flex min-h-11 items-center px-2 font-bold text-link underline underline-offset-4 active:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {t("filter.clearAll")}
                </Link>
              </li>
            </ul>
          )}
          {visible.length === 0 && (
            <p>{hasActiveFilters(filters) ? t("noMatch") : t("empty")}</p>
          )}
          <ul className="dog-grid">
            {visible.map((animal) => (
              <AnimalCard key={animal._id} animal={animal} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
