import { z } from "zod";
import { countryCodes } from "@/lib/countries";

// Option lists keep literal types, so z.enum and t() keys are typed, not just string[].
// Values are plain identifiers (no parentheses etc.) because they double as message keys.

export const employedOptions = ["yes", "no", "other"] as const; // other offers free-form input
export const householdMemberOptions = [
  "partner",
  "children",
  "alone",
  "other",
] as const; // other offers free-form input. "alone" excludes the rest
export const priorDogExperienceOptions = [
  "hadDogsInPast", // "An der Vergaangenheet hat ech schonn Hënn"
  "haveDogsNow", // "Ech hu schonn en Hond/Hënn"
  "experienceWithoutOwning", // "Ech hat nach keen Hond, konnt awer schonn Erfarung mat Hënn sammelen"
  "noExperience", // "Ech konnt nach keng Erfarung mat Hënn sammelen". Excludes the rest
] as const;
export const ownedPetOptions = ["dogs", "cats", "none", "other"] as const; // other offers free-form input. "none" excludes the rest
export const homeOwnershipOptions = ["owner", "tenant"] as const;
export const homeTypeOptions = ["apartment", "house", "other"] as const; // other offers free-form input
export const gardenFenceOptions = ["yes", "no", "noGarden"] as const; // "noGarden": the question only applies if they have one

const SHORT = 200;
const LONG = 2000;

// Error messages are message keys (see the schema docblock), so every rule passes one.
const text = (max = SHORT) => z.string().trim().min(1, "required").max(max, "tooLong");
const optionalText = (max = LONG) => z.string().trim().max(max, "tooLong").optional();
// Radio yes/no: leave the default value undefined so "unanswered" is not the same as "no"
const yesNo = z.boolean("required");
// <input type="date"> yields "YYYY-MM-DD", which also survives the Server Action boundary
const isoDate = z.iso.date("invalidDate");

const isAdult = (isoBirthDate: string) => {
  const [year, month, day] = isoBirthDate.split("-").map(Number);
  const now = new Date();
  const eighteenthBirthdayCutoff = new Date(
    now.getFullYear() - 18,
    now.getMonth(),
    now.getDate(),
  );
  return new Date(year, month - 1, day) <= eighteenthBirthdayCutoff;
};

/**
 * Shared by the client form (via zodResolver) and, later, the Server Action,
 * which must re-validate because Server Actions are public endpoints.
 *
 * Error messages are message *keys* (looked up under `AdoptPage.errors`),
 * not display strings, so the same schema works for every locale on both sides.
 *
 * Number fields expect `register(name, { valueAsNumber: true })` in the form.
 * The locale is not part of the schema: pass it to the Server Action explicitly
 * and validate it with `hasLocale`.
 */
export const adoptionSchema = z
  .object({
    name: text(100),
    email: z.email("invalidEmail").max(254, "tooLong"),
    // a string, not a number: keeps "+352", spaces and leading zeros
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()./-]{6,20}$/, "invalidPhone"),
    street: text(),
    houseNumber: text(20), // string: "12A", "12 bis"
    postalCode: text(20),
    city: text(),
    country: z.enum(countryCodes, "required"), // ISO code, picked from a list
    birthDate: isoDate.refine(isAdult, "mustBeAdult"),
    employed: z.enum(employedOptions, "required"), // multiple choice
    employedOther: optionalText(SHORT), // required if employed is "other"
    dogName: text(100), // which dog they are interested in by name
    householdMembers: z
      .array(z.enum(householdMemberOptions))
      .min(1, "required"), // "Liewen nach aner Léit mat dir am Haushalt?"
    householdMembersOther: optionalText(SHORT), // required if householdMembers includes "other"
    everyoneInHouseholdAgreesWithAdoption: yesNo, // "Ass jiddereen am Stot mat der Adoptioun vun engem Hond averstan?"
    priorDogExperience: z
      .array(z.enum(priorDogExperienceOptions))
      .min(1, "required"), // "Hues du  schonn Erfarung mat Hënn?"
    hasShelterDogExperience: yesNo, // "Hues du Erfarung mat Hënn aus dem Déiereschutz?"
    ownedPets: z.array(z.enum(ownedPetOptions)).min(1, "required"), // "Hues du schonn Hausdéieren?"
    ownedPetsOther: optionalText(SHORT), // required if ownedPets includes "other"
    positionOnCastration: text(LONG), // "Wéi stees du zum Theema Kastratioun? Sollt ee vun dengen Hausdéieren nach net kastréiert sinn, géifs du en kastréiere loossen? W.e.g erklär eis, firwat s du däin Hond kastréiere losse géifs, respektiv firwat net?"
    // "Wéi wunns du?" is optional in the Google Form. It is one checkbox list there
    // (Propriétaire, Locataire, Haus, Appartement, Other:), split here into two groups.
    // nullish, not optional: an untouched radio group reports null, not undefined.
    homeOwnership: z.enum(homeOwnershipOptions).nullish(), // owner | tenant
    homeType: z.enum(homeTypeOptions).nullish(), // apartment | house | other
    homeTypeOther: optionalText(SHORT), // required if homeType is "other"
    fencedGarden: z.enum(gardenFenceOptions, "required"), // "Wanns du e Gaart hues, ass deen agezäunt?"
    floor: text(), // "Op wéi enger Etage wunns du? Gëtt et e Lift?"
    planToMoveOrRenovate: yesNo, // "Hues du an noer Zukunft geplangt ze plënneren? Bzw. si gréisser Renovatiounsaarbechte geplangt?"
    squareMeters: z
      .number("invalidNumber")
      .min(1, "invalidNumber")
      .max(10000, "invalidNumber"), // "Weivill Quadratmeter huet är Wunnfläche?"
    neighbourhood: text(LONG), // "Wéi ass d'Ëmgéigend?"
    closestGrassField: text(), // "Wéi wäit ass et bis bei déi nooste Wiss?"
    dogHoursAloneDaily: z
      .number("invalidNumber")
      .min(0, "invalidNumber")
      .max(24, "invalidNumber"), // "Wéi vill Stonne max. ass den Hond am Dag eleng?"
    dailyWalks: text(LONG), // "Wéi oft a wéi laang plangs du mam Hond spadséieren ze goen?"
    offLimitsAreas: text(LONG), // "Ginn et Tabu Zone fir den Hond am Haushalt? Wou?"
    estimatedCosts: text(LONG), // "Mat wéienge Käschte rechens am Ufank nom Anzéie vum Hond?"
    plannedDaysOff: text(), // "Plangs du dir Congé ze huele fir den Ufank nodeems den Hond ukënnt? Wéi lang?"
    canPickUpDogAtMeetingPoint: yesNo, // "Hues du d'Méiglechkeet den Hond mam Auto an enger Begleetpersoun ob en Treffpunkt sichen ze kommen?"
    consultedOtherShelters: yesNo, // "Hues du dech bei aner Déiereschutzorganisatioune fir en Hond ausfënneg gemaach?"
    preferences: text(LONG), // "Wat wënsch du dir an engem Hond? Wéi sollt e sinn? Wéi soll en ausgesinn? Hues du Preferenzen?"
    whyShelterDog: text(LONG), // "Firwat hues du dech fir en Hond aus dem Déiereschutz entscheet?"
    awareOfBehaviourChangeAfterArrival: yesNo, // "Ass dir bewosst, dat Hënn aus déi aus dem Ausland kommen, sech charakterlech verännere kënnen, wann se bis an hirem Doheem ukommen?"
    expectedBehaviourAfterArrival: text(LONG), // "Mat wéi enge Verhalensweise rechens du nom Ukomme vum Hond?"
    wouldHireDogTrainer: yesNo, // "Plangs du bei gréisseren Erausfuerderungen dir en Hondstrainer:in resp. eng Hondsschoul un d'Säit ze huelen?"
    hasReasonsToReturnDog: yesNo, // "Ginn et fir dech Grënn en Hond erëm of ze ginn?"
    hasReturnedDogBefore: yesNo, // "Hues du scho  missen en Hond ofginn?"
    willKeepDogUntilRehomed: yesNo, // "Falls et net mam Hond an ärer Liewenssituatioun passt, an eng néi Famill gesicht misst ginn, bass du prett den Hond bei dir ze halen an eis all méiglech Informatiounen zum Hond a Fotoen ze ginn, bis mir eng endgülteg Vermëttlung ofgeschloss hunn? Dat kéint heiansdo bis zu Méint daueren."
    hasEmergencyCareOption: yesNo, // "Hues du d'Méiglechkeet den Hond ënner ze bréngen am Fall vun enger Erkrankung, enger Vakanz oder enger Situatioun déi net viraus ze gesinn ass?"
    holidayCaretaker: optionalText(), // "Ween passt op den Hond op wann s du an d'Vakanz gees, respektiv an d'Klinik fir eng länger Zäit misst?"
    dogStaysWithIfSeparation: text(LONG), // "Falls du an enger Partnerschaft oder Wunngemeinschaft liefs, hues du dir scho Gedanke gemaach, bei weem den Hond bléiwe géif?" (only applies to partnerships / shared homes)
    consentToCheckupAfterAdoption: yesNo, // "Bass du domadder averstan, dat no der Adoptioun vum Hond eng Nokontroll duerchgefouert gëtt?"
    earliestMoveInDate: isoDate, // "Ab wéini kann den Hond bei dir an d'Famill anzéien?"
    otherDogsOfInterest: optionalText(), // "Hues du nach Interesse un enger anerer Fellnues?"
    otherQuestions: text(LONG), // "Hues du nach Froen?"
    // Final page of the Google Form: two required single-checkbox confirmations.
    // Unlike the yes/no questions, only "ticked" is a valid answer.
    answeredHonestly: z.boolean().refine((value) => value, "honestyRequired"), // "Hues du all d'Froen éierlech beäntwert?" / "Jo, ech hunn d'Froen all éierlech beäntwert, a mir ass bewosst dat falsch Donnée zur Opléisung vum Schutzvertrag kënne féieren."
    consentToContact: z.boolean().refine((value) => value, "contactRequired"), // "Duerfe mir Kontakt mat dir ophuelen?" / "Jo, dir duerft Kontakt mat mir ophuelen."
    // GDPR: explicit consent to processing the data we email to the team
    consent: z.boolean().refine((value) => value, "consentRequired"),
    // Honeypot: hidden from humans, so any value means a bot filled it in
    website: z.string().max(0),
  })
  .superRefine((values, ctx) => {
    const requireIfOther = (
      isOther: boolean,
      value: string | undefined,
      path: "employedOther" | "householdMembersOther" | "ownedPetsOther" | "homeTypeOther",
    ) => {
      if (isOther && !value?.trim()) {
        ctx.addIssue({ code: "custom", path: [path], message: "required" });
      }
    };
    requireIfOther(values.employed === "other", values.employedOther, "employedOther");
    requireIfOther(
      values.householdMembers.includes("other"),
      values.householdMembersOther,
      "householdMembersOther",
    );
    requireIfOther(values.ownedPets.includes("other"), values.ownedPetsOther, "ownedPetsOther");
    requireIfOther(values.homeType === "other", values.homeTypeOther, "homeTypeOther");

    // "I live alone", "no pets" and "no experience" cannot be combined with other answers
    const exclusive = (
      selected: readonly string[],
      only: string,
      path: "householdMembers" | "ownedPets" | "priorDogExperience",
    ) => {
      if (selected.includes(only) && selected.length > 1) {
        ctx.addIssue({ code: "custom", path: [path], message: "exclusiveOption" });
      }
    };
    exclusive(values.householdMembers, "alone", "householdMembers");
    exclusive(values.ownedPets, "none", "ownedPets");
    exclusive(values.priorDogExperience, "noExperience", "priorDogExperience");
  });

export type AdoptionInput = z.input<typeof adoptionSchema>;
// equivalent to z.infer<typeof adoptionSchema>:
export type AdoptionValues = z.output<typeof adoptionSchema>;
