import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Animal } from "@/lib/animals";
import SanityImage from "../components/SanityImage";

// One adopted animal. Photo: the after-adoption photo if there is one, else
// the first photo from before. Render it inside a <ul> (the root is an <li>).
export default function HappyEndingCard({ animal }: { animal: Animal }) {
  const t = useTranslations("HappyEndingsPage.card");
  const format = useFormatter();

  const photo = animal.adoptedPhotos?.[0] ?? animal.gallery?.[0];
  const name = animal.name ?? "";
  // `adoptedDate` is a plain date ("2026-03-14"), which parses as UTC midnight.
  // Format in UTC too, so no timezone can move it to another day or month.
  const adoptedOn = animal.adoptedDate
    ? format.dateTime(new Date(animal.adoptedDate), {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <li className="dog-card">
      <p className="font-heading text-4xl font-bold">{name}</p>
      <div className="relative picture-placeholder blob-frame aspect-square w-full max-w-72">
        {photo?.url && (
          <Link
            href={{ pathname: `/animals/${animal.slug}` }}
            className="absolute inset-0"
            // Same destination as the button below, so keep this one out of
            // the tab order and the accessibility tree: it is only a bigger
            // click target for mouse and touch users (as in AnimalCard).
            tabIndex={-1}
            aria-hidden="true"
          >
            <SanityImage
              src={photo.url}
              // Without alt text the photo is decoration: the name is above it
              alt={photo.alt ?? ""}
              sizes="(min-width: 640px) 288px, 90vw"
              hotspot={photo.hotspot}
            />
          </Link>
        )}
      </div>
      {adoptedOn && (
        <p className="text-balance text-center text-xl font-bold">
          {t("adoptedOn", { date: adoptedOn })}
        </p>
      )}
      {animal.adoptedMessage && (
        <p className="text-center whitespace-pre-line">{animal.adoptedMessage}</p>
      )}
      <div className="mt-auto flex w-full flex-col gap-1">
        <Link
          href={{ pathname: `/animals/${animal.slug}` }}
          className="outlined-button font-bold"
        >
          {t("story", { name })}
        </Link>
      </div>
    </li>
  );
}
