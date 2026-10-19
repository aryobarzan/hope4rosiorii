import type { Animal } from "@/lib/animals";

// What `useTranslations("Animal")` and `await getTranslations("Animal")` both
// return, as far as this helper needs, so it works in client and server code.
type Translate = (key: string, values?: Record<string, string>) => string;

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

  for (const trait of (animal.traits ?? []).slice(0, maxTraits)) {
    parts.push(tAnimal(`traits.${trait}`));
  }
  return parts.join(" · ");
}
