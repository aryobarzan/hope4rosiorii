import { describe, expect, it } from "vitest";
import { adoptionSchema } from "./adopt";
import { validAdoption as valid } from "./adopt.fixture";

// Message keys per field path
function errors(overrides: Record<string, unknown> = {}) {
  const result = adoptionSchema.safeParse({ ...valid, ...overrides });
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("adoptionSchema", () => {
  it("accepts a complete request", () => {
    expect(adoptionSchema.safeParse(valid).success).toBe(true);
  });

  it("requires every confirmation checkbox", () => {
    expect(
      errors({ answeredHonestly: false, consentToContact: false, consent: false }),
    ).toEqual({
      answeredHonestly: "honestyRequired",
      consentToContact: "contactRequired",
      consent: "consentRequired",
    });
  });

  it("rejects a filled honeypot", () => {
    expect(errors({ website: "x" })).toHaveProperty("website");
  });

  it("does not treat an unanswered yes/no question as 'no'", () => {
    expect(errors({ hasShelterDogExperience: undefined })).toEqual({
      hasShelterDogExperience: "required",
    });
  });

  describe("fields", () => {
    it("accepts common phone formats and rejects junk", () => {
      for (const phone of ["+352621123456", "621 123 456", "(0)621/123-456"]) {
        expect(errors({ phone })).toEqual({});
      }
      expect(errors({ phone: "abc" })).toEqual({ phone: "invalidPhone" });
      expect(errors({ phone: "123" })).toEqual({ phone: "invalidPhone" });
    });

    it("rejects an unknown country code", () => {
      expect(errors({ country: "XX" })).toHaveProperty("country");
    });

    it("keeps number fields within range", () => {
      expect(errors({ squareMeters: 0 })).toEqual({ squareMeters: "invalidNumber" });
      expect(errors({ dogHoursAloneDaily: 25 })).toEqual({
        dogHoursAloneDaily: "invalidNumber",
      });
      expect(errors({ dogHoursAloneDaily: 0 })).toEqual({});
      expect(errors({ squareMeters: "90" })).toEqual({ squareMeters: "invalidNumber" });
    });

    it("rejects a malformed move-in date", () => {
      expect(errors({ earliestMoveInDate: "01/01/2030" })).toEqual({
        earliestMoveInDate: "invalidDate",
      });
    });
  });

  describe("age", () => {
    const yearsAgo = (years: number, dayOffset = 0) => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - years);
      d.setDate(d.getDate() + dayOffset);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    it("accepts someone who turns 18 today", () => {
      expect(errors({ birthDate: yearsAgo(18) })).toEqual({});
    });

    it("rejects someone who turns 18 tomorrow", () => {
      expect(errors({ birthDate: yearsAgo(18, 1) })).toEqual({
        birthDate: "mustBeAdult",
      });
    });
  });

  describe("'other' answers need details", () => {
    it.each([
      ["employed", "other", "employedOther"],
      ["homeType", "other", "homeTypeOther"],
    ])("%s = %s requires %s", (field, value, otherField) => {
      expect(errors({ [field]: value })).toEqual({ [otherField]: "required" });
      expect(errors({ [field]: value, [otherField]: "   " })).toEqual({
        [otherField]: "required",
      });
      expect(errors({ [field]: value, [otherField]: "Details" })).toEqual({});
    });

    it("requires details when household members include 'other'", () => {
      const overrides = { householdMembers: ["partner", "other"] };
      expect(errors(overrides)).toEqual({ householdMembersOther: "required" });
      expect(errors({ ...overrides, householdMembersOther: "Lodger" })).toEqual({});
    });

    it("requires details when owned pets include 'other'", () => {
      const overrides = { ownedPets: ["dogs", "other"] };
      expect(errors(overrides)).toEqual({ ownedPetsOther: "required" });
      expect(errors({ ...overrides, ownedPetsOther: "Parrot" })).toEqual({});
    });
  });

  describe("exclusive options", () => {
    it("does not allow 'alone' together with other household members", () => {
      expect(errors({ householdMembers: ["alone", "partner"] })).toEqual({
        householdMembers: "exclusiveOption",
      });
      expect(errors({ householdMembers: ["alone"] })).toEqual({});
    });

    it("does not allow 'none' together with other pets", () => {
      expect(errors({ ownedPets: ["none", "cats"] })).toEqual({
        ownedPets: "exclusiveOption",
      });
    });

    it("does not allow 'noExperience' together with other experience", () => {
      expect(
        errors({ priorDogExperience: ["noExperience", "haveDogsNow"] }),
      ).toEqual({ priorDogExperience: "exclusiveOption" });
    });

    it("needs at least one choice in each checkbox list", () => {
      expect(
        errors({ householdMembers: [], priorDogExperience: [], ownedPets: [] }),
      ).toEqual({
        householdMembers: "required",
        priorDogExperience: "required",
        ownedPets: "required",
      });
    });
  });

  it("treats the home questions as optional", () => {
    expect(errors({ homeOwnership: null, homeType: null })).toEqual({});
    expect(errors({ homeOwnership: undefined, homeType: undefined })).toEqual({});
  });
});
