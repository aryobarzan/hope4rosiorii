import { describe, expect, it } from "vitest";
import type { Animal } from "@/lib/animals";
import {
  ageBand,
  filterAnimals,
  filtersHref,
  hasActiveFilters,
  noFilters,
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
    const params = new URLSearchParams("species=cat&size=small&age=baby");
    expect(parseFilters(params)).toEqual({
      species: "cat",
      size: "small",
      age: "baby",
    });
  });

  it("treats missing and unknown values as 'all'", () => {
    expect(parseFilters(new URLSearchParams())).toEqual(noFilters);
    expect(
      parseFilters(new URLSearchParams("species=bird&size=huge&age=")),
    ).toEqual(noFilters);
  });
});

describe("ageBand", () => {
  it("puts the limits at 12 and 36 months", () => {
    expect(ageBand(0)).toBe("baby");
    expect(ageBand(11)).toBe("baby");
    expect(ageBand(12)).toBe("young");
    expect(ageBand(35)).toBe("young");
    expect(ageBand(36)).toBe("adult");
  });
});

describe("filterAnimals", () => {
  const puppy = animal({ _id: "puppy", size: ["small"], ageMonths: 5 });
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
  const cat = animal({ _id: "cat", species: "cat", ageMonths: 8 });
  const unknownAge = animal({ _id: "noage", size: ["small"] });
  const all = [puppy, youngMedium, adultRange, wideRange, cat, unknownAge];

  it("returns everything with no filters", () => {
    expect(filterAnimals(all, noFilters)).toHaveLength(all.length);
  });

  it("filters by species", () => {
    expect(ids(filterAnimals(all, { ...noFilters, species: "cat" }))).toEqual([
      "cat",
    ]);
  });

  it("matches a single size exactly", () => {
    expect(ids(filterAnimals(all, { ...noFilters, size: "small" }))).toEqual([
      "puppy",
      "wide",
      "noage",
    ]);
  });

  it("matches every size inside a two-size range", () => {
    const medium = ids(filterAnimals(all, { ...noFilters, size: "medium" }));
    expect(medium).toEqual(["young", "range", "wide"]); // small+large covers medium
    const large = ids(filterAnimals(all, { ...noFilters, size: "large" }));
    expect(large).toEqual(["range", "wide"]);
  });

  it("never matches a size filter for animals without a size", () => {
    for (const size of ["small", "medium", "large"] as const) {
      expect(ids(filterAnimals(all, { ...noFilters, size }))).not.toContain(
        "cat",
      );
    }
  });

  it("ignores size values it does not know", () => {
    const odd = animal({ _id: "odd", size: ["gigantic"] });
    expect(filterAnimals([odd], { ...noFilters, size: "large" })).toEqual([]);
  });

  it("filters by age band and drops animals with an unknown age", () => {
    expect(ids(filterAnimals(all, { ...noFilters, age: "baby" }))).toEqual([
      "puppy",
      "cat",
    ]);
    expect(ids(filterAnimals(all, { ...noFilters, age: "young" }))).toEqual([
      "young",
    ]);
    expect(ids(filterAnimals(all, { ...noFilters, age: "adult" }))).toEqual([
      "range",
      "wide",
    ]);
  });

  it("combines the filters", () => {
    const result = filterAnimals(all, {
      species: "dog",
      size: "medium",
      age: "adult",
    });
    expect(ids(result)).toEqual(["range", "wide"]);
  });
});

describe("hasActiveFilters", () => {
  it("is false only when everything is 'all'", () => {
    expect(hasActiveFilters(noFilters)).toBe(false);
    expect(hasActiveFilters({ ...noFilters, age: "adult" })).toBe(true);
  });
});

describe("filtersHref", () => {
  it("keeps the plain address when nothing is filtered", () => {
    expect(filtersHref(noFilters)).toBe("/animals");
  });

  it("leaves 'all' out of the query", () => {
    expect(filtersHref({ ...noFilters, size: "large" })).toEqual({
      pathname: "/animals",
      query: { size: "large" },
    });
    expect(
      filtersHref({ species: "dog", size: "small", age: "baby" }),
    ).toEqual({
      pathname: "/animals",
      query: { species: "dog", size: "small", age: "baby" },
    });
  });
});
