import { ageParts } from "@/lib/age";
import { getAnimals, getHighlightedAnimal } from "@/lib/animals";
import { getLocale, getTranslations } from "next-intl/server";
import SanityImage from "./SanityImage";
import { animalDetails } from "@/lib/animal-details";
import { Link } from "@/i18n/navigation";

// Fallback for the <Suspense> in the home page: same outer box and a blob of
// the same size, so the layout does not shift when the real animal streams in.
export function HighlightedAnimalSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="order-first flex w-full max-w-md flex-col items-center gap-2 md:order-0 md:ml-auto md:w-80 md:shrink-0 lg:w-md"
    >
      <div className="picture-placeholder blob-frame aspect-square w-full max-w-64" />
    </div>
  );
}

const frameClass =
  "relative picture-placeholder blob-frame aspect-square w-full max-w-64";

function Frame({
  slug,
  label,
  children,
}: {
  slug: string | null;
  // Accessible name for a link with no photo (the photo's alt names it
  // otherwise).
  label?: string;
  children: React.ReactNode;
}) {
  if (!slug) return <div className={frameClass}>{children}</div>;
  return (
    <Link
      href={{ pathname: `/dogs/${slug}` }}
      aria-label={label}
      className={frameClass}
    >
      {children}
    </Link>
  );
}

export default async function HighlightedAnimal() {
  const t = await getTranslations("DogsPage");
  const locale = await getLocale();
  const animals = await getAnimals(locale);

  const animal = getHighlightedAnimal(animals);
  // Nothing to highlight yet: render nothing, not an empty box.
  if (!animal) return null;
  const age = animal.ageMonths == null ? null : ageParts(animal.ageMonths);
  const tAge = await getTranslations("Age");
  const tAnimal = await getTranslations("Animal");
  const photo = animal.gallery?.[0];
  const name = animal.name ?? "";

  return (
    <div className="order-first flex w-full max-w-md flex-col items-center gap-2 md:order-0 md:ml-auto md:w-80 md:shrink-0 lg:w-md">
      {animal.status === "available" && (
        <p className="text-link font-bold font-heading text-xl">
          {t("card.adoptMe")}
        </p>
      )}
      <p className="font-heading text-5xl font-bold">{animal.name}</p>
      {/* Link from next-intl, so the locale prefix is kept. Without a slug
          there is no detail page to go to, so the frame is a plain div. */}
      <Frame
        slug={animal.slug}
        label={photo?.url ? undefined : name}
      >
        {photo?.url && (
          <SanityImage
            src={photo.url}
            // The editor's alt text, else the name: this is the main
            // photo of the page, so it should not be treated as decoration.
            alt={photo.alt ?? name}
            sizes="(min-width: 768px) 256px, min(90vw, 256px)"
            hotspot={photo.hotspot}
            // Above the fold and the page's main image, so not lazy.
            eager
          />
        )}
      </Frame>
      {age && (
        <p className="font-heading text-2xl">
          {tAge(age.unit, { count: age.count })}
        </p>
      )}
      <p className="text-balance text-center font-heading text-2xl">
        {animalDetails(animal, tAnimal)}
      </p>
    </div>
  );
}
