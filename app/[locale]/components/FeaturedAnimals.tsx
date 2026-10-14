import { PawPrint } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAnimals, getHighlightedAnimal } from "@/lib/animals";
import AnimalCard from "./AnimalCard";
import SectionHeading from "./SectionHeading";

const MAX_FEATURED = 3;

// The home page's dogs section: heading, one row of animals, and a link to
// all of them. The whole section is the unit, so with nothing to show it
// renders nothing, instead of a heading and a button above an empty row.
//
// The row is the ones editors marked `featured`, or, if none are, the first
// available ones. The animal already shown in the hero is left out, unless it
// is the only one available, so the row is not empty.
export default async function FeaturedAnimals() {
  const t = await getTranslations("HomePage");
  const locale = await getLocale();
  const animals = await getAnimals(locale);

  const hero = getHighlightedAnimal(animals);
  const available = animals.filter((animal) => animal.status === "available");
  const others = available.filter((animal) => animal._id !== hero?._id);
  const pool = others.length > 0 ? others : available;
  const featured = pool.filter((animal) => animal.featured);
  const shown = (featured.length > 0 ? featured : pool).slice(0, MAX_FEATURED);

  if (shown.length === 0) return null;

  return (
    <section className="page-container flex flex-col gap-8 pb-8 pt-8">
      <SectionHeading
        eyebrow={t("dogs.eyebrow")}
        heading={t("dogs.heading")}
      />
      <ul className="dog-grid">
        {shown.map((animal) => (
          <AnimalCard key={animal._id} animal={animal} />
        ))}
      </ul>
      <Link
        href={{ pathname: `/animals` }}
        className="outlined-button font-bold self-start"
      >
        <PawPrint aria-hidden="true" className="size-5" />

        {t("dogs.seeAll")}
      </Link>
    </section>
  );
}
