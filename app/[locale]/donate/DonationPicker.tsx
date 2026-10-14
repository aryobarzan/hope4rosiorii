"use client";

import { useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CircleAlert } from "lucide-react";

type Frequency = "once" | "monthly";

const presets = [10, 25, 50, 100] as const;
const defaultPreset = 25;
const minAmount = 1;

// PayPal hosted donate buttons, one per frequency (recurring donations need
// their own button). There is no monthly button yet, so monthly stays disabled.
const hostedButtonIds: Record<Frequency, string | null> = {
  once: "R6U4C2SSZWUUG",
  monthly: null,
};

// Accepts "40", "40.5", "40,50" (comma is the decimal separator in lb/fr/de).
// A regex rather than Number(): Number("1e3") and Number("0x10") are valid
// numbers, but not something a donor means to type.
function parseAmount(raw: string): number | null {
  const value = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const amount = Number(value);
  return amount >= minAmount ? amount : null;
}

// Pill-shaped choice built on a visually hidden radio: the label is the visible
// control, and `has-checked` / `has-focus-visible` style it from the input state.
const choiceClass =
  "flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border-2 border-ink px-4 text-ink " +
  "transition-colors has-checked:bg-pale not-has-checked:hover:bg-blush has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink";

export default function DonationPicker() {
  const t = useTranslations("DonatePage.picker");
  const format = useFormatter();
  const id = useId();

  const [frequency, setFrequency] = useState<Frequency>("once");
  const [preset, setPreset] = useState<number | null>(defaultPreset);
  const [custom, setCustom] = useState("");

  // A typed amount wins over the selected preset; picking a preset clears it.
  const customAmount = parseAmount(custom);
  const customInvalid = custom.trim() !== "" && customAmount === null;
  const amount = custom.trim() !== "" ? customAmount : preset;

  const formatAmount = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    });

  const hostedButtonId = hostedButtonIds[frequency];
  const canSubmit = amount !== null && hostedButtonId !== null;

  return (
    // Posts to PayPal's hosted donate page, like the embed code PayPal gives
    // out. The amount is sent along, but PayPal may ignore it for hosted
    // buttons; that is still to be confirmed.
    <form
      action="https://www.paypal.com/donate"
      method="post"
      target="_top"
      className="form-box gap-4"
    >
      <h2 className="font-heading text-4xl">{t("heading")}</h2>

      <fieldset>
        <legend className="sr-only">{t("frequencyLabel")}</legend>
        <div className="inline-flex gap-1 rounded-full border-2 border-ink p-1">
          {(["once", "monthly"] as const).map((value) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center rounded-full px-6 font-bold text-ink transition-colors has-checked:bg-ink has-checked:text-white not-has-checked:hover:bg-pale has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
            >
              <input
                type="radio"
                name={`${id}-frequency`}
                value={value}
                checked={frequency === value}
                onChange={() => setFrequency(value)}
                className="sr-only"
              />
              {t(value)}
            </label>
          ))}
        </div>
        {hostedButtonIds[frequency] === null && (
          <p role="status" className="mt-2 text-sm text-muted">
            {t("monthlyUnavailable")}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="sr-only">{t("presetsLabel")}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {presets.map((value) => (
            <label
              key={value}
              className={`${choiceClass} min-h-14 font-heading text-2xl`}
            >
              <input
                type="radio"
                name={`${id}-preset`}
                value={value}
                checked={preset === value && custom.trim() === ""}
                onChange={() => {
                  setPreset(value);
                  setCustom("");
                }}
                className="sr-only"
              />
              {formatAmount(value)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-custom`} className="form-label">
          {t("amountLabel")}
        </label>
        <input
          id={`${id}-custom`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={t("amountPlaceholder")}
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            setPreset(null);
          }}
          aria-invalid={customInvalid}
          aria-describedby={customInvalid ? `${id}-custom-error` : undefined}
          className="input-field w-full sm:w-64"
        />
        {customInvalid && (
          <p
            id={`${id}-custom-error`}
            role="alert"
            className="form-field-error flex items-start gap-1"
          >
            <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
            {t("invalidAmount", { min: formatAmount(minAmount) })}
          </p>
        )}
      </div>

      {canSubmit && (
        <>
          <input type="hidden" name="hosted_button_id" value={hostedButtonId} />
          <input type="hidden" name="amount" value={amount} />
          <input type="hidden" name="currency_code" value="EUR" />
        </>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="filled-button min-h-14 w-full text-xl font-bold"
      >
        {amount !== null
          ? t("donate", { amount: formatAmount(amount) })
          : t("donateNoAmount")}
      </button>

      <p className="text-center text-sm text-muted">{t("paypalNote")}</p>
    </form>
  );
}
