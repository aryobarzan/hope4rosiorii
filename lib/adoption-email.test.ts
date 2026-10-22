import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import lb from "@/messages/lb.json";
import { buildAdoptionEmail } from "./adoption-email";
import { adoptionSchema } from "./schemas/adopt";
import { validAdoption } from "./schemas/adopt.fixture";

const { fields, options, sections } = lb.AdoptPage;
type Field = keyof typeof fields;

// The team's email: Luxembourgish, with the fixture's answers plus overrides.
// Goes through the schema first, like in the Server Action, so the builder
// receives parsed values.
function build(overrides: Record<string, unknown> = {}) {
  const values = adoptionSchema.parse({ ...validAdoption, ...overrides });
  return buildAdoptionEmail(values, { locale: "lb", messages: lb });
}

// The answer printed under a question. The email prints "question\nanswer",
// so this reads from after the question to the end of that line.
function answerTo(email: string, field: Field) {
  const question = `${fields[field]}\n`;
  const start = email.indexOf(question);
  if (start === -1) return undefined;
  const from = start + question.length;
  const end = email.indexOf("\n", from);
  return email.slice(from, end === -1 ? undefined : end);
}

describe("buildAdoptionEmail", () => {
  it("groups the answers into the form's sections, in order", () => {
    const email = build();
    const headings = Object.values(sections).map((name) => `== ${name} ==`);

    const positions = headings.map((heading) => email.indexOf(heading));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("prints every question of the form with a label", () => {
    const email = build();
    // website (honeypot) and consent (GDPR tick) are deliberately not emailed
    const asked = Object.keys(validAdoption).filter(
      (key) => key !== "website" && key !== "consent",
    );

    for (const field of asked) {
      const question = fields[field as Field];
      expect(question, `no label for ${field}`).toBeDefined();
      expect(email, `${field} is missing from the email`).toContain(question);
    }
  });

  describe("formats answers", () => {
    it("shows yes/no answers as words", () => {
      const email = build({
        wouldHireDogTrainer: true,
        hasShelterDogExperience: false,
      });
      expect(answerTo(email, "wouldHireDogTrainer")).toBe(options.yes);
      expect(answerTo(email, "hasShelterDogExperience")).toBe(options.no);
    });

    it("shows a single choice as its label, not its key", () => {
      const email = build({ fencedGarden: "noGarden", employed: "no" });
      expect(answerTo(email, "fencedGarden")).toBe(options.fencedGarden.noGarden);
      expect(answerTo(email, "employed")).toBe(options.employed.no);
    });

    it("lists a multiple choice as comma-separated labels", () => {
      const email = build({ householdMembers: ["partner", "children"] });
      expect(answerTo(email, "householdMembers")).toBe(
        `${options.householdMembers.partner}, ${options.householdMembers.children}`,
      );
    });

    it("shows free text as written", () => {
      const email = build({ floor: "Second floor, with lift" });
      expect(answerTo(email, "floor")).toBe("Second floor, with lift");
    });

    it("shows numbers as numbers, including zero", () => {
      const email = build({ squareMeters: 90, dogHoursAloneDaily: 0 });
      expect(answerTo(email, "squareMeters")).toBe("90");
      // 0 is a real answer ("never alone"), not an empty one
      expect(answerTo(email, "dogHoursAloneDaily")).toBe("0");
    });

    it("shows the country by name and code", () => {
      const email = build({ country: "LU" });
      const name = new Intl.DisplayNames("lb", { type: "region" }).of("LU");
      expect(answerTo(email, "country")).toBe(`${name} (LU)`);
    });

    it("shows a dash for questions left empty", () => {
      const email = build({ holidayCaretaker: undefined, homeType: null });
      expect(answerTo(email, "holidayCaretaker")).toBe("-");
      expect(answerTo(email, "homeType")).toBe("-");
    });
  });

  describe("'other: please specify' answers", () => {
    it("are left out when the applicant did not choose 'other'", () => {
      const email = build();
      expect(email).not.toContain(fields.employedOther);
    });

    it.each([
      [
        "employed",
        { employed: "other", employedOther: "Student" },
        "employedOther",
        "Student",
      ],
      [
        "household members",
        { householdMembers: ["partner", "other"], householdMembersOther: "Lodger" },
        "householdMembersOther",
        "Lodger",
      ],
      [
        "owned pets",
        { ownedPets: ["dogs", "other"], ownedPetsOther: "Parrot" },
        "ownedPetsOther",
        "Parrot",
      ],
      [
        "home type",
        { homeType: "other", homeTypeOther: "Houseboat" },
        "homeTypeOther",
        "Houseboat",
      ],
    ] as const)(
      "appear with their details when chosen: %s",
      (_description, overrides, otherField, details) => {
        const email = build(overrides);
        expect(answerTo(email, otherField)).toBe(details);
      },
    );
  });

  it("is written in the language it is given", () => {
    const values = adoptionSchema.parse(validAdoption);
    const email = buildAdoptionEmail(values, { locale: "en", messages: en });

    expect(email).toContain(`== ${en.AdoptPage.sections.contact} ==`);
    expect(email).toContain(en.AdoptPage.fields.name);
    expect(email).not.toContain(lb.AdoptPage.fields.name);
    // Country names follow the language too
    expect(email).toContain("Luxembourg (LU)");
  });
});
