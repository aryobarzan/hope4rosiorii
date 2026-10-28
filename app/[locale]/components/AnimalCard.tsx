import { useTranslations } from "next-intl";
import { PawPrint, Cat, Dog } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ageParts } from "@/lib/age";
import { animalDetails } from "@/lib/animal-details";
import type { Animal } from "@/lib/animals";
import SanityImage from "./SanityImage";

const adoptedBadge = "pill text-link font-heading text-xl";

const MAX_TRAITS_ON_CARD = 2;

// One animal as a card. No "use client": it only uses useTranslations, which
// works in server and client components alike, so the dogs page (client
// filters) and the home page (server) can both render it. Render it inside a
// <ul> (the root is an <li>).
export default function AnimalCard({ animal }: { animal: Animal }) {
  const t = useTranslations("DogsPage");
  const tAnimal = useTranslations("Animal");
  const tAge = useTranslations("Age");

  const adopted = animal.status === "adopted";
  const photo = animal.gallery?.[0];
  const age = animal.ageMonths == null ? null : ageParts(animal.ageMonths);

  return (
    <li className="dog-card" data-adopted={adopted}>
      {adopted && <p className={adoptedBadge}>{t("card.adopted")}</p>}
      <p className="font-heading text-4xl font-bold">{animal.name}</p>

      {/* Fills the card up to 18rem and stays square. A fixed w-72 overflowed
          cards narrower than 288px (e.g. on phones). Without a photo the
          coloured placeholder stays. */}
      <div
        className={`relative picture-placeholder blob-frame aspect-square w-full max-w-72 ${photo || !adopted ? `` : `bg-link`}`}
      >
        {photo?.url && (
          <SanityImage
            src={photo.url}
            alt={photo.alt ?? ""}
            sizes="(min-width: 640px) 288px, 90vw"
            hotspot={photo.hotspot}
          />
        )}
      </div>
      {age && (
        <p className="font-heading text-2xl font-bold">
          {tAge(age.unit, { count: age.count })}
        </p>
      )}
      {/* The card's align-items: center centres this paragraph's box, not
          the text inside it. text-center centres each wrapped line, and
          text-balance evens out the line lengths, so a wrap does not
          leave one long line and a single orphaned word. */}
      <p className="text-balance text-center font-heading text-2xl">
        {animalDetails(animal, tAnimal, { maxTraits: MAX_TRAITS_ON_CARD })}
      </p>

      {/* mt-auto: an automatic top margin takes all the free space in this
          flex column, which pushes the button to the card's bottom edge
          (cards in a row are equally tall), even without a description. */}
      {!adopted && (
        <div className="mt-auto flex w-full flex-col gap-1">
          <Link
            href={{ pathname: `/animals/${animal.slug}` }}
            className="filled-button font-bold"
          >
            {animal.species === "dog" ? (
              <Dog aria-hidden="true" className="size-5" />
            ) : animal.species === "cat" ? (
              <Cat aria-hidden="true" className="size-5" />
            ) : (
              <PawPrint aria-hidden="true" className="size-5" />
            )}

            {t("card.learnMore", { name: animal.name ?? "" })}
          </Link>
        </div>
      )}
    </li>
  );
}
