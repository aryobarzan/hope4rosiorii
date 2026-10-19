import { useFormatter, useTranslations } from "next-intl";
import { PawPrint, Cat, Dog } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ageParts } from "@/lib/age";
import { animalDetails } from "@/lib/animal-details";
import type { Animal } from "@/lib/animals";
import HealthIcon from "./HealthIcon";
import SanityImage from "./SanityImage";

type AnimalPreviewCardType = "contact" | "adoption";

// A compact summary of one animal, shown next to a form so the visitor sees
// the key facts (traits, good with, health) without leaving it. No "use
// client": useTranslations and useFormatter work in server components too.
// Unlike AnimalCard the root is an <article>, not an <li>, so it can sit
// anywhere (e.g. in an <aside>).
export default function AnimalPreviewCard({
  animal,
  cardType,
}: {
  animal: Animal;
  cardType: AnimalPreviewCardType;
}) {
  const t = useTranslations("DogsPage");
  const tPreview = useTranslations("AnimalPreview");
  const tPage = useTranslations("AnimalPage");
  const tAnimal = useTranslations("Animal");
  const tAge = useTranslations("Age");
  const format = useFormatter();

  const adopted = animal.status === "adopted";
  const photo = animal.gallery?.[0];
  const age = animal.ageMonths == null ? null : ageParts(animal.ageMonths);

  return (
    <article className="dog-card" data-adopted={adopted}>
      <p className="text-link font-bold font-heading text-xl">
        {tPreview(cardType)}
      </p>
      <p className="font-heading text-4xl font-bold">{animal.name}</p>

      <div
        className={`relative picture-placeholder blob-frame aspect-square w-full max-w-36 ${photo || !adopted ? `` : `bg-link`}`}
      >
        {photo?.url && (
          <SanityImage
            src={photo.url}
            alt={photo.alt ?? ""}
            sizes="144px"
            hotspot={photo.hotspot}
          />
        )}
      </div>
      {age && (
        <p className="font-heading text-xl">
          {tAge(age.unit, { count: age.count })}
        </p>
      )}
      <div className="flex flex-col gap-1 text-balance text-center font-body text-sm">
        <p>{animalDetails(animal, tAnimal)}</p>
        {/* Only rendered when something is known: an empty list means "not
            recorded", never "not good with anyone". Same wording and `unit`
            list style as the animal page. */}
        {animal.goodWith && animal.goodWith.length > 0 && (
          <p>
            {tPage("goodWith", {
              list: format.list(
                animal.goodWith.map((value) => tAnimal(`goodWith.${value}`)),
                { type: "unit" },
              ),
            })}
          </p>
        )}
      </div>

      {animal.health && animal.health.length > 0 && (
        <div className="flex w-full flex-col items-center gap-1">
          <ul className="flex flex-wrap justify-center gap-1">
            {animal.health.map((health) => (
              <li key={health} className="pill text-sm text-link">
                <HealthIcon health={health} />
                {tAnimal(`health.${health}`)}
              </li>
            ))}
          </ul>
        </div>
      )}

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
    </article>
  );
}
