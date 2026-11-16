// The special needs an animal can have, as stored in Sanity (`specialNeeds` in
// the studio's animal schema). The studio only knows the values; the grouping
// and the translated labels live here and in the `Animal` messages. If you
// add a value in the studio, add it here and in every messages file
// (`Animal.specialNeeds.<value>`), or the site shows a missing translation.
export const SPECIAL_NEED_GROUPS = {
  physical: ["blind", "deaf", "tripawd", "paralysis"],
  neurological: [
    "cerebellarHypoplasia",
    "ivdd",
    "degenerativeMyelopathy",
    "radialNerveParalysis",
    "epilepsy",
    "vestibularDisease",
    "hydrocephalus",
    "cognitiveDysfunction",
  ],
  chronic: ["diabetes", "heartworm", "fiv", "felv", "allergies", "incontinence"],
} as const;

export type SpecialNeedCategory = keyof typeof SPECIAL_NEED_GROUPS;
export const SPECIAL_NEED_CATEGORIES = Object.keys(
  SPECIAL_NEED_GROUPS,
) as SpecialNeedCategory[];

// "Other" belongs to no group: the editor explains it in the note
export const SPECIAL_NEED_OTHER = "other";

export type SpecialNeed =
  | (typeof SPECIAL_NEED_GROUPS)[SpecialNeedCategory][number]
  | typeof SPECIAL_NEED_OTHER;

// Every value in display order
export const SPECIAL_NEEDS: readonly SpecialNeed[] = [
  ...SPECIAL_NEED_CATEGORIES.flatMap((category) => SPECIAL_NEED_GROUPS[category]),
  SPECIAL_NEED_OTHER,
];

// The values an animal has that the site knows, in display order. Anything
// else (a value added in the studio but not here yet) is left out rather than
// shown without a translation.
export function knownSpecialNeeds(values: readonly string[] | null | undefined) {
  return SPECIAL_NEEDS.filter((need) => values?.includes(need));
}

// Behaviours an adopter should be prepared for (`behaviours` in the studio).
// Same rule as the needs: a new value needs a translation under
// `Animal.behaviours.<value>`.
export const BEHAVIOURS = [
  "separationAnxiety",
  "underSocialized",
  "reactive",
  "resourceGuarding",
] as const;

export type Behaviour = (typeof BEHAVIOURS)[number];

export function knownBehaviours(values: readonly string[] | null | undefined) {
  return BEHAVIOURS.filter((behaviour) => values?.includes(behaviour));
}
