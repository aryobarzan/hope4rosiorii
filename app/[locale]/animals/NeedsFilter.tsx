"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { AnimalKey } from "@/lib/animal-details";
import {
  type Filters,
  NEEDS_ANY,
  filtersHref,
  toggleNeed,
} from "@/lib/animal-filters";
import {
  SPECIAL_NEED_CATEGORIES,
  SPECIAL_NEED_GROUPS,
  SPECIAL_NEED_OTHER,
  type SpecialNeed,
} from "@/lib/special-needs";

const checkboxRow =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 hover:bg-pale active:bg-[color-mix(in_srgb,var(--color-pale),var(--color-ink)_12%)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink";

// The special-needs filter: one "Any special need" checkbox, plus a
// collapsible list of the specific needs (grouped, and only those at least one
// animal of the species has). Ticking specific needs shows animals with ANY of
// them. The master checkbox is ticked as soon as anything is chosen, and shows
// a dash (indeterminate) when only some specific needs are ticked; unticking
// it clears the choice. State lives in the URL, so a click is a navigation.
export default function NeedsFilter({
  filters,
  available,
}: {
  filters: Filters;
  // The needs to offer, in display order
  available: readonly SpecialNeed[];
}) {
  const t = useTranslations("DogsPage.filter");
  const tAnimal = useTranslations("Animal");
  const router = useRouter();
  const listId = useId();

  const specific = filters.needs.filter((need) => need !== NEEDS_ANY);
  // Open from the start when a shared address already names specific needs
  const [open, setOpen] = useState(specific.length > 0);

  // A need named in the address stays listed even if no animal of this species
  // has it, so it can always be unticked
  const offered = (need: SpecialNeed) =>
    available.includes(need) || specific.includes(need);

  function go(needs: Filters["needs"]) {
    router.push(filtersHref({ ...filters, needs }), { scroll: false });
  }

  const label = (need: SpecialNeed) =>
    tAnimal(`specialNeeds.${need}` as AnimalKey);

  const groups = SPECIAL_NEED_CATEGORIES.map((category) => ({
    category,
    needs: SPECIAL_NEED_GROUPS[category].filter(offered),
  })).filter((group) => group.needs.length > 0);
  const hasOther = offered(SPECIAL_NEED_OTHER);

  const checkbox = (need: SpecialNeed) => (
    <label key={need} className={checkboxRow}>
      <input
        type="checkbox"
        checked={specific.includes(need)}
        onChange={() => go(toggleNeed(filters.needs, need))}
        className="size-5 shrink-0 cursor-pointer accent-button"
      />
      {label(need)}
    </label>
  );

  return (
    <fieldset className="flex min-w-0 flex-col gap-1">
      <legend className="mb-1 font-bold">{t("needsLabel")}</legend>
      <div className="flex items-center gap-1">
        <label className={`${checkboxRow} grow`}>
          <input
            type="checkbox"
            checked={filters.needs.length > 0}
            ref={(input) => {
              if (input) input.indeterminate = specific.length > 0;
            }}
            onChange={() => go(filters.needs.length > 0 ? [] : [NEEDS_ANY])}
            className="size-5 shrink-0 cursor-pointer accent-button"
          />
          {t("needsAny")}
        </label>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={t("needsNarrow")}
          onClick={() => setOpen(!open)}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink hover:bg-pale active:bg-[color-mix(in_srgb,var(--color-pale),var(--color-ink)_12%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`size-4 fill-none stroke-current stroke-2 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div id={listId} hidden={!open} className="flex flex-col gap-3 pl-3">
        {groups.map(({ category, needs }) => (
          <fieldset key={category} className="flex min-w-0 flex-col">
            <legend className="px-3 text-sm font-bold text-muted">
              {tAnimal(`specialNeedCategory.${category}`)}
            </legend>
            {needs.map(checkbox)}
          </fieldset>
        ))}
        {hasOther && checkbox(SPECIAL_NEED_OTHER)}
      </div>
    </fieldset>
  );
}
