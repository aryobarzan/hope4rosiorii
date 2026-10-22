import { createTranslator, type Locale } from "next-intl";
import type { AdoptionValues } from "@/lib/schemas/adopt";

type Field = keyof AdoptionValues;
type Messages = Parameters<typeof createTranslator>[0]["messages"];

// Same sections and order as the form, so the email reads like the form did.
// `as const` keeps the field names literal for the exhaustiveness check below.
const sections = [
  {
    key: "contact",
    fields: [
      "name",
      "email",
      "phone",
      "birthDate",
      "street",
      "houseNumber",
      "postalCode",
      "city",
      "country",
      "employed",
      "employedOther",
      "dogName",
    ],
  },
  {
    key: "household",
    fields: [
      "householdMembers",
      "householdMembersOther",
      "everyoneInHouseholdAgreesWithAdoption",
      "dogStaysWithIfSeparation",
    ],
  },
  {
    key: "experience",
    fields: [
      "priorDogExperience",
      "hasShelterDogExperience",
      "ownedPets",
      "ownedPetsOther",
      "positionOnCastration",
      "consultedOtherShelters",
      "hasReturnedDogBefore",
    ],
  },
  {
    key: "home",
    fields: [
      "homeOwnership",
      "homeType",
      "homeTypeOther",
      "fencedGarden",
      "floor",
      "squareMeters",
      "closestGrassField",
      "neighbourhood",
      "offLimitsAreas",
      "planToMoveOrRenovate",
    ],
  },
  {
    key: "daily",
    fields: [
      "dogHoursAloneDaily",
      "dailyWalks",
      "plannedDaysOff",
      "holidayCaretaker",
      "hasEmergencyCareOption",
      "estimatedCosts",
      "canPickUpDogAtMeetingPoint",
    ],
  },
  {
    key: "expectations",
    fields: [
      "preferences",
      "whyShelterDog",
      "awareOfBehaviourChangeAfterArrival",
      "expectedBehaviourAfterArrival",
      "wouldHireDogTrainer",
      "hasReasonsToReturnDog",
      "willKeepDogUntilRehomed",
      "consentToCheckupAfterAdoption",
    ],
  },
  {
    key: "closing",
    fields: [
      "earliestMoveInDate",
      "otherDogsOfInterest",
      "otherQuestions",
      "answeredHonestly",
      "consentToContact",
    ],
  },
] as const;

// Compile-time guard: adding a question to the schema without adding it to a
// section above makes this fail to type-check, instead of silently dropping
// the answer from the email. `website` (honeypot) and `consent` (GDPR tick,
// always true by now) are deliberately not part of the email.
//
// How it works, using the types only (nothing here runs at runtime):
//
// 1. `Listed` is the union of every field name used in the sections above,
//    e.g. "name" | "email" | ... . This only works because of `as const`:
//    without it TypeScript would widen the names to plain `string`.
// 2. `Missing` is every schema field that is NOT in `Listed` (and is not one of
//    the two deliberate exceptions). `Exclude<A, B>` removes from the union A
//    everything that is part of B. If every question is listed, nothing is left
//    and `Missing` is `never`, the empty union.
// 3. The constant's type is `true` when `Missing` is empty and `never` otherwise.
//    Assigning `true` to a `never` is a type error, so a missing field turns
//    into a compile error (in `tsc` and `next build`) that names the field,
//    e.g. `Type 'true' is not assignable to type 'never'`, with `Missing`
//    resolving to the forgotten field when you hover it.
//
// `[Missing] extends [never]` is wrapped in tuples on purpose: a bare `never`
// in a conditional type distributes over an empty union and the whole type
// collapses to `never` even when nothing is missing.
//
// To fix an error here, add the new field to the fitting section above (or,
// if it should not be emailed, to the exceptions in `Exclude`).
type Listed = (typeof sections)[number]["fields"][number];
type Missing = Exclude<Field, Listed | "website" | "consent">;
const _allQuestionsAreInTheEmail: [Missing] extends [never] ? true : never = true;
// Only here so the linter doesn't flag the constant as unused
void _allQuestionsAreInTheEmail;

/**
 * Plain-text body for the team, with every answer under its question, in the
 * language of `messages` (the team's, not the applicant's).
 */
export function buildAdoptionEmail(
  values: AdoptionValues,
  { locale, messages }: { locale: Locale; messages: Messages },
) {
  const t = createTranslator({ locale, messages, namespace: "AdoptPage" });
  const countryNames = new Intl.DisplayNames(locale, { type: "region" });

  const option = (field: string, value: string) =>
    t.has(`options.${field}.${value}`)
      ? t(`options.${field}.${value}`)
      : value;

  const format = (field: Field): string => {
    const value = values[field];
    if (value === undefined || value === null || value === "") return "-";
    if (typeof value === "boolean") return t(value ? "options.yes" : "options.no");
    if (Array.isArray(value)) return value.map((v) => option(field, v)).join(", ");
    if (field === "country") return `${countryNames.of(value as string)} (${value})`;
    // Single-choice questions (employed, homeType, ...) store an option key
    return option(field, String(value));
  };

  const blocks = sections.map(({ key, fields }) => {
    const lines = fields
      // The "other: please specify" fields only matter once they're filled in
      .filter((field) => !field.endsWith("Other") || values[field])
      .map((field) => `${t(`fields.${field}`)}\n${format(field)}`);
    return [`== ${t(`sections.${key}`)} ==`, ...lines].join("\n\n");
  });

  return blocks.join("\n\n\n");
}
