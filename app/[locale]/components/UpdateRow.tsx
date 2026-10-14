import { useFormatter, useTranslations } from "next-intl";
import type { DonationUpdate } from "@/lib/updates";
import SanityImage from "./SanityImage";

// One donation update as a white row: photo, date, amount spent, title and
// caption. Shared by the donate page and the home page. No "use client": the
// next-intl hooks work in server and client components alike. Render it
// inside a <ul> (the root is an <li>).
export default function UpdateRow({ update }: { update: DonationUpdate }) {
  const t = useTranslations("DonatePage");
  const format = useFormatter();

  return (
    <li className="update-row">
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
      <div className="flex w-full min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill shrink-0 bg-pale">
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
          {update.date && (
            <time dateTime={update.date} className="ml-auto">
              {format.dateTime(new Date(update.date), {
                dateStyle: "long",
                timeZone: "UTC",
              })}
            </time>
          )}
        </div>
        <h3 className="font-heading text-2xl font-bold">{update.title}</h3>
        <p>{update.caption}</p>
      </div>
    </li>
  );
}
