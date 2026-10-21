import { describe, expect, it } from "vitest";
import type { Animal } from "@/lib/animals";
import { animalDetails } from "./animal-details";

// Echoes the key (and values), so the tests check which messages are asked for
// and in what order, not their wording
const t = (key: string, values?: Record<string, string>) =>
  values ? `${key}(${Object.values(values).join(",")})` : key;

function animal(fields: Partial<Animal>): Animal {
  return {
    species: "dog",
    gender: null,
    size: null,
    traits: null,
    ...fields,
  } as Animal;
}

describe("animalDetails", () => {
  it("joins gender, size and traits in that order", () => {
    const line = animalDetails(
      animal({
        gender: "female",
        size: ["medium"],
        traits: ["playful", "calm"],
      }),
      t,
    );
    expect(line).toBe(
      "gender.female · size.medium · traits.playful · traits.calm",
    );
  });

  it("shows two sizes as a range, smallest first", () => {
    const line = animalDetails(animal({ size: ["large", "medium"] }), t);
    expect(line).toBe("sizeRange(size.medium,size.large)");
  });

  it("does not show a size for cats", () => {
    const line = animalDetails(
      animal({ species: "cat", size: ["small"], gender: "male" }),
      t,
    );
    expect(line).toBe("gender.male");
  });

  it("limits the number of traits when asked", () => {
    const traits = ["playful", "calm", "gentle"] as Animal["traits"];
    expect(animalDetails(animal({ traits }), t, { maxTraits: 2 })).toBe(
      "traits.playful · traits.calm",
    );
    expect(animalDetails(animal({ traits }), t)).toBe(
      "traits.playful · traits.calm · traits.gentle",
    );
  });

  it("returns an empty string when there is nothing to show", () => {
    expect(animalDetails(animal({}), t)).toBe("");
  });
});
