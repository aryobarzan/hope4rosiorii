"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import {
  ChevronDown,
  CircleAlert,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Tag,
  User,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@/i18n/navigation";
import {
  contactReasons,
  contactSchema,
  type ContactInput,
  type ContactValues,
} from "@/lib/schemas/contact";

const linkClass =
  "rounded font-bold text-link underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

// Decorative icon placed before a label's text
const labelClass = "form-label flex items-center gap-2";
const iconClass = "size-5 shrink-0 text-muted";

export default function ContactForm() {
  const t = useTranslations("ContactPage");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ContactInput, unknown, ContactValues>({
    resolver: zodResolver(contactSchema),
    // Show a field's error once it's been left, but keep `isValid` live
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      message: "",
      consent: false,
      website: "",
    },
  });

  // Schema messages are keys - they have to be translated here
  const error = (field: keyof ContactInput) => {
    const key = errors[field]?.message;
    return key ? t(`errors.${key}` as Parameters<typeof t>[0]) : null;
  };

  async function onSubmit(values: ContactValues) {
    // TODO: call the Server Action, which re-validates with contactSchema,
    // checks the honeypot, rate limits, and sends the email via Resend.
    console.log(values);
  }

  const fieldError = (field: keyof ContactInput) => {
    const message = error(field);
    return message ? (
      <p
        id={`${field}-error`}
        role="alert"
        className="form-field-error flex items-start gap-1"
      >
        <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
        {message}
      </p>
    ) : null;
  };

  const describedBy = (field: keyof ContactInput) =>
    errors[field] ? `${field}-error` : undefined;

  // noValidate: we disable browser's built-in validation and rely solely on our own zod/react-hook-form based rules and validation, as well as error messages.
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="form-box gap-4"
    >
      {/* flex-1 on email and name fields so they take up equal widths in the same row */}
      {/* min-w-0 ensures they do not shrink below their content's minimum width. */}
      <div className="flex flex-row gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="name" className={labelClass}>
            <User aria-hidden="true" className={iconClass} />
            {t("name")}
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={describedBy("name")}
            className="input-field"
            {...register("name")}
          />
          {fieldError("name")}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="email" className={labelClass}>
            <Mail aria-hidden="true" className={iconClass} />
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email")}
            className="input-field"
            {...register("email")}
          />
          {fieldError("email")}
        </div>
      </div>

      <label htmlFor="reason" className={labelClass}>
        <Tag aria-hidden="true" className={iconClass} />
        {t("reason")}
      </label>
      <div className="relative">
        <select
          id="reason"
          defaultValue=""
          aria-invalid={!!errors.reason}
          aria-describedby={describedBy("reason")}
          className="input-field"
          {...register("reason")}
        >
          <option value="" disabled>
            {t("reasonPlaceholder")}
          </option>
          {contactReasons.map((key) => (
            <option key={key} value={key}>
              {t(`reasons.${key}`)}
            </option>
          ))}
        </select>
        {/* select.input-field has appearance: none, so draw the arrow ourselves */}
        {/* absolute to position the arrow relative to the ancesor (div) */}
        {/* top-1/2 moves top edge to middle of wrapper, so we shift it back up by -translate-y-1/2, i.e., half of its height. */}
        {/* right-4 pins the arrow to the right edge with some padding */}
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2"
        />
      </div>
      {fieldError("reason")}

      <label htmlFor="message" className={labelClass}>
        <MessageSquare aria-hidden="true" className={iconClass} />
        {t("message")}
      </label>
      <textarea
        id="message"
        aria-invalid={!!errors.message}
        aria-describedby={describedBy("message")}
        className="input-field textarea-field"
        {...register("message")}
      />
      {fieldError("message")}

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
          </span>
        </label>
        {fieldError("consent")}
      </div>

      <div className="flex flex-row items-center gap-2">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="filled-button"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="size-5" />
          )}
          {t("submit")}
        </button>
        <p>
          {t.rich("adoptPrompt", {
            link: (chunks) => (
              <Link href="/adopt" className={linkClass}>
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </form>
  );
}
