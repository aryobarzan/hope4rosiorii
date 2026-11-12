import type { useTranslations } from "next-intl";
import { ageBand } from "@/lib/animal-filters";
import type { Animal } from "@/lib/animals";

// Months between the estimated birth date and now, rounded down, never negative.
export function monthsSince(date: string | null, now: Date): number | null {
  if (!date) return null;
  const born = new Date(date);
  const months =
    (now.getUTCFullYear() - born.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - born.getUTCMonth()) -
    (now.getUTCDate() < born.getUTCDate() ? 1 : 0);
  return Math.max(0, months);
}

// Turns an age in months into the unit and count the `Age` messages expect.
// Under a year shows months (at least 1), otherwise whole years, rounded.
export function ageParts(months: number): {
  unit: "months" | "years";
  count: number;
} {
  if (months < 12) return { unit: "months", count: Math.max(1, months) };
  return { unit: "years", count: Math.round(months / 12) };
}

// What `useTranslations("Age")` and `await getTranslations("Age")` both return,
// as far as ageLine needs.
type AgeKey = Parameters<ReturnType<typeof useTranslations<"Age">>>[0];
type Translate = (key: AgeKey, values?: { count: number }) => string;

// "Puppy · ca. 5 months": the stage name (which depends on the species) and
// the approximate age. Null when the age is unknown; without a species there is
// no stage, so only the age is shown.
export function ageLine(
  animal: Pick<Animal, "species" | "ageMonths">,
  tAge: Translate,
): string | null {
  if (animal.ageMonths == null) return null;
  const { unit, count } = ageParts(animal.ageMonths);
  const age = tAge(unit, { count });
  if (!animal.species) return age;
  const stage = tAge(`stage.${ageBand(animal.species, animal.ageMonths)}`);
  return `${stage} · ${age}`;
}
