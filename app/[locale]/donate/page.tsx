import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Landmark, PawPrint } from "lucide-react";
import CopyButton from "./CopyButton";
import DonationPicker from "./DonationPicker";
import { getSiteSettings } from "@/lib/site-settings";
import { getUpdates } from "@/lib/updates";
import SanityImage from "../components/SanityImage";

const stepClass =
  "flex h-8 min-w-16 shrink-0 px-2 items-center justify-center rounded-full bg-white font-heading text-xl text-ink";

export default async function Donate() {
  const t = await getTranslations("DonatePage");
  const format = await getFormatter();
  const locale = await getLocale();
  const [settings, updates] = await Promise.all([
    getSiteSettings(),
    getUpdates(locale),
  ]);
  const { bank, impactAmounts } = settings;
  // Amounts are shown as examples of what a gift covers; the wording lives in
  // the messages under DonatePage.impact and the amounts in Site settings. They
  // are placeholders until the team confirms real figures, hence the square
  // brackets in the badge. Remove the brackets in the markup below once confirmed.
  const impact = [
    { amount: impactAmounts.food, key: "food" },
    { amount: impactAmounts.vaccination, key: "vaccination" },
    { amount: impactAmounts.crate, key: "crate" },
    { amount: impactAmounts.journey, key: "journey" },
  ] as const;

  return (
    <div className="flex flex-col w-full">
      <section className="page-container flex flex-col gap-1 pb-8 pt-8">
        <p className="font-heading text-xl text-link">{t("eyebrow")}</p>
        <h1 className="font-heading text-5xl">{t("heading")}</h1>
        <p>{t("description")}</p>
        {/* One column on small screens. From lg: the picker on the left, and the
          gift and bank boxes stacked in a column on the right. items-start stops
          the columns stretching to the tallest one. */}
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
          <DonationPicker />
          <div className="flex flex-col gap-4">
            <section className="flex flex-col gap-2 prominent-box">
              <h2 className="flex items-center gap-2 font-heading text-2xl font-bold">
                <PawPrint
                  aria-hidden="true"
                  strokeWidth={2.5}
                  className="size-6 shrink-0"
                />
                {t("impact.heading")}
              </h2>

              <ul className="flex flex-col gap-2">
                {impact.map(({ amount, key }) => (
                  <li key={key} className="flex items-center gap-3">
                    <span className={stepClass}>
                      [
                      {format.number(amount, {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      })}
                      ]
                    </span>
                    <span>{t(`impact.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-2 alternate-box">
              <h2 className="flex items-center gap-2 font-heading text-2xl font-bold">
                <Landmark
                  aria-hidden="true"
                  strokeWidth={2.5}
                  className="size-6 shrink-0"
                />
                {t("bank.heading")}
              </h2>
              <p>{t("bank.intro")}</p>
              {/* A description list pairs each label with its value for screen
                readers. select-all: one click or tap selects the whole value,
                which makes copying into a banking app easy. */}
              <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1">
                <dt className="font-bold">{t("bank.iban")}</dt>
                <dd className="flex items-center gap-1">
                  <span className="wrap-break-word font-mono select-all">
                    {bank.iban}
                  </span>
                  <CopyButton value={bank.iban} field={t("bank.iban")} />
                </dd>
                <dt className="font-bold">{t("bank.bic")}</dt>
                <dd className="flex items-center gap-1">
                  <span className="font-mono select-all">{bank.bic}</span>
                  <CopyButton value={bank.bic} field={t("bank.bic")} />
                </dd>
                <dt className="font-bold">{t("bank.accountName")}</dt>
                <dd>{bank.accountName}</dd>
              </dl>
            </section>
          </div>
        </div>
      </section>
      <section className="w-full bg-pale">
        <div className="page-container flex flex-col gap-1 pt-8 pb-8">
          <p className="font-heading text-xl text-link">
            {t("updates.eyebrow")}
          </p>
          <h2 className="font-heading text-5xl mb-4">{t("updates.heading")}</h2>
          {/* A list, so assistive tech announces "list of N items"; gap-4 spaces
              the cards (the container's gap-1 is meant for the heading). */}
          <ul className="flex flex-col gap-4">
            {updates.map((update) => (
              <li className="update-row" key={update._id}>
                <div className="relative picture-placeholder blob-frame h-24 w-24 shrink-0">
                  {update.image?.url && (
                    <SanityImage
                      src={update.image.url}
                      alt={update.image.alt ?? ""}
                      sizes="96px"
                      hotspot={update.image.hotspot}
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {update.date && (
                      <time dateTime={update.date}>
                        {format.dateTime(new Date(update.date), {
                          dateStyle: "long",
                          timeZone: "UTC",
                        })}
                      </time>
                    )}
                    <span className="shrink-0 rounded-full bg-pale px-3 py-0.5 font-bold text-ink">
                      {t("updates.spent", {
                        amount: format.number(update.amountSpent ?? 0, {
                          style: "currency",
                          currency: "EUR",
                          minimumFractionDigits: Number.isInteger(update.amountSpent)
                            ? 0
                            : 2,
                        }),
                      })}
                    </span>
                  </div>
                  <h3 className="font-heading text-2xl font-bold">
                    {update.title}
                  </h3>
                  <p>{update.caption}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
