// Data access for animals (dogs and cats). Pages and components only call
// these functions, never the Sanity client.
//
// Cached with `use cache` and tagged "animal". The Sanity webhook
// (app/api/revalidate/route.ts) calls revalidateTag with the changed
// document's type, so editors see changes without a deploy.
import { cacheLife, cacheTag } from "next/cache";
import { client } from "@/lib/sanity/client";
import type { ANIMALS_QUERY_RESULT } from "@/sanity.types";
import { ANIMALS_QUERY } from "@/lib/sanity/queries";

// Months between the estimated birth date and now, rounded down, never negative.
function monthsSince(date: string | null, now: Date): number | null {
  if (!date) return null;
  const born = new Date(date);
  const months =
    (now.getUTCFullYear() - born.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - born.getUTCMonth()) -
    (now.getUTCDate() < born.getUTCDate() ? 1 : 0);
  return Math.max(0, months);
}

// An animal as the query returns it, plus the fields computed in getAnimals.
// Add any new computed field here too (see the note at the bottom of the file).
// `[number]` indexes the array type like `array[0]` does at runtime: it gives
// the type of one element, not the array.
export type Animal = ANIMALS_QUERY_RESULT[number] & {
  ageMonths: number | null;
};

export async function getAnimals(locale: string): Promise<Animal[]> {
  // Server-side cache shared by all visitors, keyed by the arguments
  // (one entry per locale). Sanity is only queried on a cache miss.
  "use cache";
  // Label for on-demand invalidation: the Sanity webhook calls
  // revalidateTag("animal"), which marks every locale's entry as outdated.
  cacheTag("animal");
  // Time-based fallback if no webhook fires. `days`, not `max`: the age is
  // computed below and frozen into the cache, so it must refresh over time.
  cacheLife("days");

  const animals = await client.fetch<ANIMALS_QUERY_RESULT>(ANIMALS_QUERY, { locale });
  const now = new Date();
  return animals.map((animal) => ({
    ...animal,
    // Age is derived from estimatedBirthDate, never stored as text.
    ageMonths: monthsSince(animal.estimatedBirthDate, now),
  }));
}

export async function getAnimal(slug: string, locale: string) {
  const animals = await getAnimals(locale);
  return animals.find((animal) => animal.slug === slug);
}

// The animal the home page highlights in its hero. One definition, so the
// hero and the featured row agree on which animal is already on screen.
export function getHighlightedAnimal(animals: Animal[]): Animal | undefined {
  return animals[0];
}

// Alternative approach, kept for reference: infer the type from the function.
//
//   export async function getAnimals(locale: string) {
//     // ... same body, no return type annotation
//   }
//   export type Animal = Awaited<ReturnType<typeof getAnimals>>[number];
//
// Why we don't use it: `Animal` always matches the function's real output
// with nothing to keep in sync, but the signature says nothing about what it
// returns and the type is harder to read. Spelled out as above, the signature
// documents itself and a mistake in the `.map` is reported inside
// getAnimals. The cost is that a new computed field must be added to
// `Animal` by hand. Fields coming from the query flow through automatically
// once sanity.types.ts is regenerated.
