import type { useTranslations } from "next-intl";
import type { Animal } from "@/lib/animals";

// A message key of the "Animal" namespace, e.g. "gender.female".
export type AnimalKey = Parameters<ReturnType<typeof useTranslations<"Animal">>>[0];

// Some keys are built from CMS values ("health.dewormed", "goodWith.cats"),
// which the compiler cannot check. Cast those with `as AnimalKey`: it marks
// the one place where a missing translation is possible, instead of switching
// the key check off everywhere.

// What `useTranslations("Animal")` and `await getTranslations("Animal")` both
// return, as far as this helper needs, so it works in client and server code.
type Translate = (key: AnimalKey, values?: Record<string, string>) => string;

const SIZE_ORDER = ["small", "medium", "large"];

// "Female • Medium-sized • Playful • Calm": the one-line summary shown under
// an animal's photo, on its card and on its page.
// `maxTraits` shortens the line for cards; omit it to list every trait.
export function animalDetails(
  animal: Animal,
  tAnimal: Translate,
  { maxTraits }: { maxTraits?: number } = {},
): string {
  const parts: string[] = [];
  if (animal.gender) {
    parts.push(tAnimal(`gender.${animal.gender}` as AnimalKey));
  }

  // Size is only asked for dogs.
  if (animal.species === "dog" && animal.size?.length) {
    const sizes = animal.size.toSorted(
      (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b),
    );
    const size = (value: string) => tAnimal(`size.${value}` as AnimalKey);
    parts.push(
      sizes.length > 1
        ? tAnimal("sizeRange", {
            from: size(sizes[0]),
            to: size(sizes[sizes.length - 1]),
          })
        : size(sizes[0]),
    );
  }

  for (const trait of (animal.traits ?? []).slice(0, maxTraits)) {
    parts.push(tAnimal(`traits.${trait}` as AnimalKey));
  }
  return parts.join(" · ");
}
