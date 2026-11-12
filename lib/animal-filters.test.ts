import { describe, expect, it } from "vitest";
import type { Animal } from "@/lib/animals";
import {
  AGES,
  SPECIES,
  ageBand,
  filterAnimals,
  filtersHref,
  hasActiveFilters,
  noFilters,
  resolveSpecies,
  type Filters,
  parseFilters,
} from "./animal-filters";

// Only the fields the filters read; the cast skips the rest of the query result
function animal(fields: Partial<Animal> & { _id: string }): Animal {
  return {
    species: "dog",
    size: null,
    ageMonths: null,
    ...fields,
  } as Animal;
}

const ids = (animals: Animal[]) => animals.map((a) => a._id);

describe("parseFilters", () => {
  it("reads known values from the URL", () => {
    const params = new URLSearchParams("species=dog&size=small&age=puppy");
    expect(parseFilters(params)).toEqual({
      species: "dog",
      size: "small",
      age: "puppy",
    });
  });

  it("checks the age against the species' own stages", () => {
    expect(parseFilters(new URLSearchParams("species=cat&age=kitten")).age).toBe(
      "kitten",
    );
    // a dog is never a kitten, and a cat is never a puppy
    expect(parseFilters(new URLSearchParams("species=dog&age=kitten")).age).toBe(
      "all",
    );
    expect(parseFilters(new URLSearchParams("species=cat&age=puppy")).age).toBe(
      "all",
    );
    // no species in the address means dogs
    expect(parseFilters(new URLSearchParams("age=puppy"))).toEqual({
      ...noFilters,
      age: "puppy",
    });
  });

  it("falls back to dogs, and to 'all' for size and age", () => {
    expect(parseFilters(new URLSearchParams())).toEqual(noFilters);
    expect(
      parseFilters(new URLSearchParams("species=bird&size=huge&age=")),
    ).toEqual(noFilters);
  });
});

describe("ageBand", () => {
  it("gives dogs five stages", () => {
    expect(ageBand("dog", 0)).toBe("puppy");
    expect(ageBand("dog", 5)).toBe("puppy");
    expect(ageBand("dog", 6)).toBe("juvenile");
    expect(ageBand("dog", 11)).toBe("juvenile");
    expect(ageBand("dog", 12)).toBe("youngAdult");
    expect(ageBand("dog", 23)).toBe("youngAdult");
    expect(ageBand("dog", 24)).toBe("matureAdult");
    expect(ageBand("dog", 83)).toBe("matureAdult");
    expect(ageBand("dog", 84)).toBe("senior");
    expect(ageBand("dog", 300)).toBe("senior");
  });

  it("gives cats six stages", () => {
    expect(ageBand("cat", 6)).toBe("kitten"); // "birth to 6 months"
    expect(ageBand("cat", 7)).toBe("junior");
    expect(ageBand("cat", 35)).toBe("junior");
    expect(ageBand("cat", 36)).toBe("adult");
    expect(ageBand("cat", 83)).toBe("adult");
    expect(ageBand("cat", 84)).toBe("mature");
    expect(ageBand("cat", 131)).toBe("mature");
    expect(ageBand("cat", 132)).toBe("senior");
    expect(ageBand("cat", 179)).toBe("senior");
    expect(ageBand("cat", 180)).toBe("superSenior");
  });

  it("can reach every stage of every species", () => {
    for (const species of SPECIES) {
      const reached = new Set<string>();
      for (let months = 0; months <= 400; months++) {
        reached.add(ageBand(species, months));
      }
      expect([...reached]).toEqual([...AGES[species]]);
    }
  });
});

describe("filterAnimals", () => {
  const puppy = animal({ _id: "puppy", size: ["small"], ageMonths: 5 });
  const juvenile = animal({ _id: "juvenile", size: ["medium"], ageMonths: 10 });
  const youngMedium = animal({ _id: "young", size: ["medium"], ageMonths: 20 });
  const adultRange = animal({
    _id: "range",
    size: ["medium", "large"],
    ageMonths: 60,
  });
  const wideRange = animal({
    _id: "wide",
    size: ["large", "small"], // unordered on purpose
    ageMonths: 40,
  });
  const kitten = animal({ _id: "kitten", species: "cat", ageMonths: 3 });
  const adultCat = animal({ _id: "adultcat", species: "cat", ageMonths: 50 });
  const unknownAge = animal({ _id: "noage", size: ["small"] });
  const all = [
    puppy,
    juvenile,
    youngMedium,
    adultRange,
    wideRange,
    kitten,
    adultCat,
    unknownAge,
  ];
  const dogs = noFilters;
  const cats: Filters = { ...noFilters, species: "cat" };

  it("shows dogs by default and only the chosen species", () => {
    expect(ids(filterAnimals(all, dogs))).toEqual([
      "puppy",
      "juvenile",
      "young",
      "range",
      "wide",
      "noage",
    ]);
    expect(ids(filterAnimals(all, cats))).toEqual(["kitten", "adultcat"]);
  });

  it("matches a single size exactly", () => {
    expect(ids(filterAnimals(all, { ...dogs, size: "small" }))).toEqual([
      "puppy",
      "wide",
      "noage",
    ]);
  });

  it("matches every size inside a two-size range", () => {
    const medium = ids(filterAnimals(all, { ...dogs, size: "medium" }));
    expect(medium).toEqual(["juvenile", "young", "range", "wide"]); // small+large covers medium
    const large = ids(filterAnimals(all, { ...dogs, size: "large" }));
    expect(large).toEqual(["range", "wide"]);
  });

  it("never matches a size filter for animals without a size", () => {
    for (const size of ["small", "medium", "large"] as const) {
      expect(ids(filterAnimals(all, { ...cats, size }))).toEqual([]);
    }
  });

  it("ignores size values it does not know", () => {
    const odd = animal({ _id: "odd", size: ["gigantic"] });
    expect(filterAnimals([odd], { ...dogs, size: "large" })).toEqual([]);
  });

  it("filters dogs by age stage and drops animals with an unknown age", () => {
    expect(ids(filterAnimals(all, { ...dogs, age: "puppy" }))).toEqual([
      "puppy",
    ]);
    expect(ids(filterAnimals(all, { ...dogs, age: "juvenile" }))).toEqual([
      "juvenile",
    ]);
    expect(ids(filterAnimals(all, { ...dogs, age: "youngAdult" }))).toEqual([
      "young",
    ]);
    expect(ids(filterAnimals(all, { ...dogs, age: "matureAdult" }))).toEqual([
      "range",
      "wide", // 40 months
    ]);
  });

  it("filters cats by their own age stages", () => {
    expect(ids(filterAnimals(all, { ...cats, age: "kitten" }))).toEqual([
      "kitten",
    ]);
    expect(ids(filterAnimals(all, { ...cats, age: "junior" }))).toEqual([]);
    expect(ids(filterAnimals(all, { ...cats, age: "adult" }))).toEqual([
      "adultcat",
    ]);
  });

  it("combines the filters", () => {
    const result = filterAnimals(all, {
      species: "dog",
      size: "medium",
      age: "matureAdult",
    });
    expect(ids(result)).toEqual(["range", "wide"]);
  });
});

describe("resolveSpecies", () => {
  const dog = animal({ _id: "d" });
  const cat = animal({ _id: "c", species: "cat" });

  it("keeps the chosen species when it has animals", () => {
    expect(resolveSpecies([dog, cat], noFilters)).toBe(noFilters);
    expect(resolveSpecies([dog], noFilters)).toBe(noFilters);
  });

  it("switches to cats when there are no dogs, and resets size and age", () => {
    const stale: Filters = { species: "dog", size: "small", age: "puppy" };
    expect(resolveSpecies([cat], stale)).toEqual({
      species: "cat",
      size: "all",
      age: "all",
    });
  });

  it("changes nothing for an empty list", () => {
    expect(resolveSpecies([], noFilters)).toBe(noFilters);
  });
});

describe("hasActiveFilters", () => {
  it("ignores the species, which is always chosen", () => {
    expect(hasActiveFilters(noFilters)).toBe(false);
    expect(hasActiveFilters({ ...noFilters, species: "cat" })).toBe(false);
  });

  it("is true once a size or an age is chosen", () => {
    expect(hasActiveFilters({ ...noFilters, age: "senior" })).toBe(true);
    expect(hasActiveFilters({ ...noFilters, size: "small" })).toBe(true);
  });
});

describe("filtersHref", () => {
  it("keeps the plain address when nothing is filtered", () => {
    expect(filtersHref(noFilters)).toBe("/animals");
  });

  it("leaves 'all' and the default species out of the query", () => {
    expect(filtersHref({ ...noFilters, size: "large" })).toEqual({
      pathname: "/animals",
      query: { size: "large" },
    });
    expect(
      filtersHref({ species: "dog", size: "small", age: "puppy" }),
    ).toEqual({
      pathname: "/animals",
      query: { size: "small", age: "puppy" },
    });
  });

  it("keeps the species when it is not the default", () => {
    expect(filtersHref({ species: "cat", size: "all", age: "kitten" })).toEqual({
      pathname: "/animals",
      query: { species: "cat", age: "kitten" },
    });
  });
});
