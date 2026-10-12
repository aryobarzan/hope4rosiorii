"use client";

import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { ChevronDown, CircleAlert, Loader2, Send } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@/i18n/navigation";
import type { CountryOption, getCountryOptions } from "@/lib/countries";
import {
  adoptionSchema,
  employedOptions,
  gardenFenceOptions,
  homeOwnershipOptions,
  homeTypeOptions,
  householdMemberOptions,
  ownedPetOptions,
  priorDogExperienceOptions,
  type AdoptionInput,
  type AdoptionValues,
} from "@/lib/schemas/adopt";

const linkClass =
  "rounded font-bold text-link underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

type Field = keyof AdoptionInput;
// Fields that take free text, and fields whose answer is a number
type TextField = {
  [K in Field]: AdoptionInput[K] extends string | undefined ? K : never;
}[Field];
type NumberField = "squareMeters" | "dogHoursAloneDaily";
type BooleanField = {
  [K in Field]: AdoptionInput[K] extends boolean ? K : never;
}[Field];

// "Other" free-text fields are optional in the schema, but required once their
// "other" option is chosen (and they are only rendered then)
const conditionallyRequired: readonly Field[] = [
  "employedOther",
  "householdMembersOther",
  "ownedPetsOther",
  "homeTypeOther",
];

// Derived from the schema, so the asterisks can't drift from the validation:
// a field is required when it rejects `undefined`.
const isRequired = (field: Field) =>
  conditionallyRequired.includes(field) ||
  !adoptionSchema.shape[field].safeParse(undefined).success;

export default function AdoptForm({
  countries,
}: {
  countries: ReturnType<typeof getCountryOptions>;
}) {
  const t = useTranslations("AdoptPage");

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdoptionInput, unknown, AdoptionValues>({
    resolver: zodResolver(adoptionSchema),
    // Show a field's error once it's been left. Radios and checkboxes report
    // on change, so their errors show as soon as the group is touched.
    mode: "onTouched",
    // Every text field starts as "" (not undefined), so an untouched required
    // field fails with our "required" key instead of Zod's English type error.
    // Radio groups and numbers stay undefined: "unanswered" must not look like "no".
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      birthDate: "",
      employedOther: "",
      dogName: "",
      householdMembers: [],
      householdMembersOther: "",
      priorDogExperience: [],
      ownedPets: [],
      ownedPetsOther: "",
      positionOnCastration: "",
      homeTypeOther: "",
      floor: "",
      neighbourhood: "",
      closestGrassField: "",
      dailyWalks: "",
      offLimitsAreas: "",
      estimatedCosts: "",
      plannedDaysOff: "",
      preferences: "",
      whyShelterDog: "",
      expectedBehaviourAfterArrival: "",
      holidayCaretaker: "",
      dogStaysWithIfSeparation: "",
      earliestMoveInDate: "",
      otherDogsOfInterest: "",
      otherQuestions: "",
      answeredHonestly: false,
      consentToContact: false,
      consent: false,
      website: "",
    },
  });

  // "other" options reveal an extra free-text field
  const employed = watch("employed");
  const householdMembers = watch("householdMembers");
  const ownedPets = watch("ownedPets");
  const homeType = watch("homeType");

  async function onSubmit(values: AdoptionValues) {
    // TODO: call the Server Action with `values` and the current locale
    // (useLocale(); next/root-params doesn't work in Server Actions). The
    // action re-validates with adoptionSchema, validates the locale with
    // hasLocale, checks the honeypot, rate limits, and sends the email via Resend.
    console.log(values);
  }

  // Schema messages are keys - they have to be translated here
  const fieldError = (field: Field) => {
    const key = errors[field]?.message;
    return key ? (
      <p
        id={`${field}-error`}
        role="alert"
        className="form-field-error flex items-start gap-1"
      >
        <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
        {t(`errors.${key}` as Parameters<typeof t>[0])}
      </p>
    ) : null;
  };

  const describedBy = (field: Field) =>
    errors[field] ? `${field}-error` : undefined;

  // aria-hidden: screen readers get `aria-required` on the input instead
  const requiredMark = (field: Field) =>
    isRequired(field) ? (
      <span aria-hidden="true" className="ml-1 text-red-600">
        *
      </span>
    ) : null;

  // The helpers below return JSX (they are called, not rendered as components),
  // so React doesn't remount the inputs on every keystroke.

  const textInput = (
    field: TextField,
    options: {
      type?: "text" | "email" | "tel" | "date";
      autoComplete?: string;
      multiline?: boolean;
    } = {},
  ) => (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor={field} className="form-label">
        {t(`fields.${field}`)}
        {requiredMark(field)}
      </label>
      {options.multiline ? (
        <textarea
          id={field}
          aria-required={isRequired(field)}
          aria-invalid={!!errors[field]}
          aria-describedby={describedBy(field)}
          className="input-field textarea-field"
          {...register(field)}
        />
      ) : (
        <input
          id={field}
          type={options.type ?? "text"}
          autoComplete={options.autoComplete}
          aria-required={isRequired(field)}
          aria-invalid={!!errors[field]}
          aria-describedby={describedBy(field)}
          className="input-field"
          {...register(field)}
        />
      )}
      {fieldError(field)}
    </div>
  );

  const numberInput = (field: NumberField) => (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor={field} className="form-label">
        {t(`fields.${field}`)}
        {requiredMark(field)}
      </label>
      <input
        id={field}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        aria-required={isRequired(field)}
          aria-invalid={!!errors[field]}
        aria-describedby={describedBy(field)}
        className="input-field"
        // An empty field becomes NaN, which the schema reports as `invalidNumber`
        {...register(field, { valueAsNumber: true })}
      />
      {fieldError(field)}
    </div>
  );

  // Native <select>: free keyboard support, a good mobile picker, and no dependency.
  // Options are ISO codes; the names come in as props, localised on the server.
  const countrySelect = () => {
    const option = ({ code, name }: CountryOption) => (
      <option key={code} value={code}>
        {name}
      </option>
    );
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor="country" className="form-label">
          {t("fields.country")}
          {requiredMark("country")}
        </label>
        <div className="relative">
          <select
            id="country"
            defaultValue=""
            autoComplete="country"
            aria-required="true"
            aria-invalid={!!errors.country}
            aria-describedby={describedBy("country")}
            className="input-field"
            {...register("country")}
          >
            <option value="" disabled>
              {t("countryPlaceholder")}
            </option>
            <optgroup label={t("countryGroups.common")}>
              {countries.priority.map(option)}
            </optgroup>
            <optgroup label={t("countryGroups.all")}>
              {countries.others.map(option)}
            </optgroup>
          </select>
          {/* select.input-field has appearance: none, so draw the arrow ourselves */}
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2"
          />
        </div>
        {fieldError("country")}
      </div>
    );
  };

  // Single answer. Radios register by plain string value.
  const radioGroup = (
    field: "employed" | "homeOwnership" | "homeType" | "fencedGarden",
    options: readonly string[],
  ) => (
    <fieldset
      aria-describedby={describedBy(field)}
      className="flex min-w-0 flex-col gap-1"
    >
      <legend className="form-label mb-1">{t(`fields.${field}`)}
        {requiredMark(field)}</legend>
      {options.map((option) => (
        <label key={option} className="flex min-h-11 items-center gap-3">
          <input
            type="radio"
            value={option}
            className="size-5 shrink-0 accent-button"
            {...register(field)}
          />
          {t(`options.${field}.${option}` as Parameters<typeof t>[0])}
        </label>
      ))}
      {fieldError(field)}
    </fieldset>
  );

  // Several answers. Checkboxes sharing one name give back an array of values.
  const checkboxGroup = (
    field: "householdMembers" | "priorDogExperience" | "ownedPets",
    options: readonly string[],
  ) => (
    <fieldset
      aria-describedby={describedBy(field)}
      className="flex min-w-0 flex-col gap-1"
    >
      <legend className="form-label mb-1">{t(`fields.${field}`)}
        {requiredMark(field)}</legend>
      {options.map((option) => (
        <label key={option} className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            value={option}
            className="size-5 shrink-0 accent-button"
            {...register(field)}
          />
          {t(`options.${field}.${option}` as Parameters<typeof t>[0])}
        </label>
      ))}
      {fieldError(field)}
    </fieldset>
  );

  // Radios only hand back strings, but the schema wants a real boolean, so
  // these go through a Controller that converts on change.
  const yesNo = (field: BooleanField) => (
    <Controller
      control={control}
      name={field}
      render={({ field: { value, onChange, onBlur, ref } }) => (
        <fieldset
          aria-describedby={describedBy(field)}
          className="flex min-w-0 flex-col gap-1"
        >
          <legend className="form-label mb-1">{t(`fields.${field}`)}
        {requiredMark(field)}</legend>
          <div className="flex flex-row gap-6">
            {([true, false] as const).map((answer) => (
              <label
                key={String(answer)}
                className="flex min-h-11 items-center gap-3"
              >
                <input
                  type="radio"
                  name={field}
                  // only the first radio takes the ref, so focus-on-error lands on it
                  ref={answer ? ref : undefined}
                  checked={value === answer}
                  onChange={() => onChange(answer)}
                  onBlur={onBlur}
                  className="size-5 shrink-0 accent-button"
                />
                {t(answer ? "options.yes" : "options.no")}
              </label>
            ))}
          </div>
          {fieldError(field)}
        </fieldset>
      )}
    />
  );

  // A question answered by ticking a single statement (only "ticked" is valid)
  const acknowledgement = (field: "answeredHonestly" | "consentToContact") => (
    <fieldset
      aria-describedby={describedBy(field)}
      className="flex min-w-0 flex-col gap-1"
    >
      <legend className="form-label mb-1">
        {t(`fields.${field}`)}
        {requiredMark(field)}
      </legend>
      <label className="flex min-h-11 items-start gap-3 py-2">
        <input
          type="checkbox"
          aria-required="true"
          aria-invalid={!!errors[field]}
          className="mt-0.5 size-5 shrink-0 accent-button"
          {...register(field)}
        />
        <span>{t(`statements.${field}`)}</span>
      </label>
      {fieldError(field)}
    </fieldset>
  );

  const section = (key: string, children: React.ReactNode) => (
    <section aria-labelledby={`section-${key}`} className="flex flex-col gap-4">
      <h2 id={`section-${key}`} className="font-heading text-3xl">
        {t(`sections.${key}` as Parameters<typeof t>[0])}
      </h2>
      {children}
    </section>
  );

  // noValidate: browser validation is off, our zod/react-hook-form rules and
  // messages are the only ones. On a failed submit, RHF focuses the first
  // invalid field.
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="form-box gap-8"
    >
      {section(
        "contact",
        <>
          <div className="flex flex-col gap-4 sm:flex-row">
            {textInput("name", { autoComplete: "name" })}
            {textInput("email", { type: "email", autoComplete: "email" })}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            {textInput("phone", { type: "tel", autoComplete: "tel" })}
            {textInput("birthDate", { type: "date", autoComplete: "bday" })}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            {textInput("street", { autoComplete: "address-line1" })}
            {textInput("houseNumber")}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            {textInput("postalCode", { autoComplete: "postal-code" })}
            {textInput("city", { autoComplete: "address-level2" })}
          </div>
          {countrySelect()}
          {radioGroup("employed", employedOptions)}
          {employed === "other" && textInput("employedOther")}
          {textInput("dogName")}
        </>,
      )}

      {section(
        "household",
        <>
          {checkboxGroup("householdMembers", householdMemberOptions)}
          {householdMembers?.includes("other") &&
            textInput("householdMembersOther")}
          {yesNo("everyoneInHouseholdAgreesWithAdoption")}
          {textInput("dogStaysWithIfSeparation", { multiline: true })}
        </>,
      )}

      {section(
        "experience",
        <>
          {checkboxGroup("priorDogExperience", priorDogExperienceOptions)}
          {yesNo("hasShelterDogExperience")}
          {checkboxGroup("ownedPets", ownedPetOptions)}
          {ownedPets?.includes("other") && textInput("ownedPetsOther")}
          {textInput("positionOnCastration", { multiline: true })}
          {yesNo("consultedOtherShelters")}
          {yesNo("hasReturnedDogBefore")}
        </>,
      )}

      {section(
        "home",
        <>
          {radioGroup("homeOwnership", homeOwnershipOptions)}
          {radioGroup("homeType", homeTypeOptions)}
          {homeType === "other" && textInput("homeTypeOther")}
          {radioGroup("fencedGarden", gardenFenceOptions)}
          {textInput("floor")}
          <div className="flex flex-col gap-4 sm:flex-row">
            {numberInput("squareMeters")}
            {textInput("closestGrassField")}
          </div>
          {textInput("neighbourhood", { multiline: true })}
          {textInput("offLimitsAreas", { multiline: true })}
          {yesNo("planToMoveOrRenovate")}
        </>,
      )}

      {section(
        "daily",
        <>
          {numberInput("dogHoursAloneDaily")}
          {textInput("dailyWalks", { multiline: true })}
          {textInput("plannedDaysOff")}
          {textInput("holidayCaretaker", { multiline: true })}
          {yesNo("hasEmergencyCareOption")}
          {textInput("estimatedCosts", { multiline: true })}
          {yesNo("canPickUpDogAtMeetingPoint")}
        </>,
      )}

      {section(
        "expectations",
        <>
          {textInput("preferences", { multiline: true })}
          {textInput("whyShelterDog", { multiline: true })}
          {yesNo("awareOfBehaviourChangeAfterArrival")}
          {textInput("expectedBehaviourAfterArrival", { multiline: true })}
          {yesNo("wouldHireDogTrainer")}
          {yesNo("hasReasonsToReturnDog")}
          {yesNo("willKeepDogUntilRehomed")}
          {yesNo("consentToCheckupAfterAdoption")}
        </>,
      )}

      {section(
        "closing",
        <>
          {textInput("earliestMoveInDate", { type: "date" })}
          {textInput("otherDogsOfInterest")}
          {textInput("otherQuestions", { multiline: true })}
          {acknowledgement("answeredHonestly")}
          {acknowledgement("consentToContact")}
        </>,
      )}

      {/* Honeypot: clipped to 1px (sr-only) rather than pushed off-screen, which
          would widen the page and add a horizontal scrollbar. Skipped by
          keyboard (tabIndex -1) and screen readers (aria-hidden). */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      {/* gap-3, not gap-1: `.form-field-error` has a -0.25rem top margin that
          offsets the gap, and unlike the inputs this label has no bottom margin */}
      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            aria-invalid={!!errors.consent}
            aria-describedby={describedBy("consent")}
            className="mt-1 size-5 shrink-0 accent-button"
            {...register("consent")}
          />
          <span>
            {t.rich("consent", {
              link: (chunks) => (
                <Link href="/privacy-policy" className={linkClass}>
                  {chunks}
                </Link>
              ),
            })}
            <span aria-hidden="true" className="ml-1 text-red-600">
              *
            </span>
          </span>
        </label>
        {fieldError("consent")}
      </div>

      {/* Not disabled while invalid, unlike the contact form: with this many
          fields a dead button gives no hint what is missing. Submitting
          instead shows the errors and focuses the first one. */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="filled-button"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="size-5" />
          )}
          {t("submit")}
        </button>
      </div>
    </form>
  );
}
