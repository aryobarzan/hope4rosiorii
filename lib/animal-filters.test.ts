import { describe, expect, it } from "vitest";
import type { Animal } from "@/lib/animals";
import {
  AGES,
  SPECIES,
  ageBand,
  availableNeeds,
  filterAnimals,
  filtersHref,
  hasActiveFilters,
  noFilters,
  resolveSpecies,
  toggleNeed,
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
      gender: "all",
      needs: [],
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
      gender: "all",
      needs: [],
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

  it("switches to cats when there are no dogs, and resets size, age and needs", () => {
    const stale: Filters = {
      species: "dog",
      size: "small",
      age: "puppy",
      gender: "male",
      needs: ["blind"],
    };
    expect(resolveSpecies([cat], stale)).toEqual({
      species: "cat",
      size: "all",
      age: "all",
      gender: "male", // gender applies to both species, so it stays
      needs: [],
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

  it("is true once a size, an age, a gender or a need is chosen", () => {
    expect(hasActiveFilters({ ...noFilters, gender: "female" })).toBe(true);
    expect(hasActiveFilters({ ...noFilters, age: "senior" })).toBe(true);
    expect(hasActiveFilters({ ...noFilters, size: "small" })).toBe(true);
    expect(hasActiveFilters({ ...noFilters, needs: ["any"] })).toBe(true);
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
      filtersHref({
        species: "dog",
        size: "small",
        age: "puppy",
        gender: "all",
        needs: [],
      }),
    ).toEqual({
      pathname: "/animals",
      query: { size: "small", age: "puppy" },
    });
  });

  it("keeps the species when it is not the default", () => {
    expect(
      filtersHref({
        species: "cat",
        size: "all",
        age: "kitten",
        gender: "all",
        needs: [],
      }),
    ).toEqual({
      pathname: "/animals",
      query: { species: "cat", age: "kitten" },
    });
  });

  it("writes the needs as one comma-separated value", () => {
    expect(filtersHref({ ...noFilters, needs: ["any"] })).toEqual({
      pathname: "/animals",
      query: { needs: "any" },
    });
    expect(filtersHref({ ...noFilters, needs: ["blind", "deaf"] })).toEqual({
      pathname: "/animals",
      query: { needs: "blind,deaf" },
    });
  });
});

describe("special needs", () => {
  const blind = animal({ _id: "blind", specialNeeds: ["blind"] });
  const blindDeaf = animal({ _id: "bd", specialNeeds: ["blind", "deaf"] });
  const diabetic = animal({ _id: "diabetic", specialNeeds: ["diabetes"] });
  const healthy = animal({ _id: "healthy", specialNeeds: [] });
  const unknown = animal({ _id: "unknown", specialNeeds: null });
  const felv = animal({
    _id: "felv",
    species: "cat",
    specialNeeds: ["felv", "allergies"],
  });
  const all = [blind, blindDeaf, diabetic, healthy, unknown, felv];

  describe("parseFilters", () => {
    it("reads one need, several needs, or 'any'", () => {
      expect(parseFilters(new URLSearchParams("needs=any")).needs).toEqual([
        "any",
      ]);
      expect(parseFilters(new URLSearchParams("needs=blind")).needs).toEqual([
        "blind",
      ]);
      expect(
        parseFilters(new URLSearchParams("needs=blind,deaf")).needs,
      ).toEqual(["blind", "deaf"]);
    });

    it("puts needs in display order and drops duplicates and unknown values", () => {
      expect(
        parseFilters(new URLSearchParams("needs=diabetes,flying,blind,blind"))
          .needs,
      ).toEqual(["blind", "diabetes"]);
      expect(parseFilters(new URLSearchParams("needs=flying")).needs).toEqual(
        [],
      );
    });

    it("lets 'any' win over specific needs", () => {
      expect(
        parseFilters(new URLSearchParams("needs=blind,any")).needs,
      ).toEqual(["any"]);
    });
  });

  describe("filterAnimals", () => {
    const dogs = noFilters;

    it("'any' keeps animals with at least one need", () => {
      expect(ids(filterAnimals(all, { ...dogs, needs: ["any"] }))).toEqual([
        "blind",
        "bd",
        "diabetic",
      ]);
    });

    it("matches animals with ANY of the chosen needs", () => {
      expect(ids(filterAnimals(all, { ...dogs, needs: ["blind"] }))).toEqual([
        "blind",
        "bd",
      ]);
      expect(
        ids(filterAnimals(all, { ...dogs, needs: ["deaf", "diabetes"] })),
      ).toEqual(["bd", "diabetic"]);
    });

    it("combines with the other filters and respects the species", () => {
      expect(
        ids(filterAnimals(all, { ...dogs, size: "small", needs: ["any"] })),
      ).toEqual([]);
      expect(
        ids(filterAnimals(all, { ...dogs, species: "cat", needs: ["any"] })),
      ).toEqual(["felv"]);
    });
  });

  describe("availableNeeds", () => {
    it("lists only the needs the species has, in display order", () => {
      expect(availableNeeds(all, "dog")).toEqual(["blind", "deaf", "diabetes"]);
      expect(availableNeeds(all, "cat")).toEqual(["felv", "allergies"]);
    });

    it("is empty when no animal has a need", () => {
      expect(availableNeeds([healthy, unknown], "dog")).toEqual([]);
    });
  });

  describe("toggleNeed", () => {
    it("adds and removes a need, keeping display order", () => {
      expect(toggleNeed([], "deaf")).toEqual(["deaf"]);
      expect(toggleNeed(["deaf"], "blind")).toEqual(["blind", "deaf"]);
      expect(toggleNeed(["blind", "deaf"], "blind")).toEqual(["deaf"]);
    });

    it("replaces 'any' with the picked need", () => {
      expect(toggleNeed(["any"], "deaf")).toEqual(["deaf"]);
    });
  });
});

describe("gender", () => {
  const female = animal({ _id: "f", gender: "female" });
  const male = animal({ _id: "m", gender: "male" });
  const unknown = animal({ _id: "u", gender: null });
  const all = [female, male, unknown];

  it("is read from the address, and unknown values are ignored", () => {
    expect(parseFilters(new URLSearchParams("gender=female")).gender).toBe(
      "female",
    );
    expect(parseFilters(new URLSearchParams("gender=other")).gender).toBe("all");
  });

  it("keeps only animals of that gender", () => {
    expect(ids(filterAnimals(all, { ...noFilters, gender: "female" }))).toEqual([
      "f",
    ]);
    expect(ids(filterAnimals(all, { ...noFilters, gender: "male" }))).toEqual([
      "m",
    ]);
    expect(ids(filterAnimals(all, noFilters))).toEqual(["f", "m", "u"]);
  });

  it("goes into the address", () => {
    expect(filtersHref({ ...noFilters, gender: "male" })).toEqual({
      pathname: "/animals",
      query: { gender: "male" },
    });
  });
});
