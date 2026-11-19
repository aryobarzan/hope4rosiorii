import { Heart } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAnimals, happyEndings } from "@/lib/animals";
import HappyEndingCard from "../happy-endings/HappyEndingCard";
import SectionHeading from "./SectionHeading";

const MAX_SHOWN = 3;

// The home page's happy endings teaser: the most recent adoptions and a link
// to all of them. Left out entirely when there are none yet, like the other
// home sections, instead of a heading above an empty row.
export default async function HappyEndingsSection() {
  const locale = await getLocale();
  const t = await getTranslations("HomePage.happyEndings");
  const shown = happyEndings(await getAnimals(locale)).slice(0, MAX_SHOWN);

  if (shown.length === 0) return null;

  return (
    <section className="page-container page-section section-stack">
      <SectionHeading heading={t("heading")} />
      <ul className="dog-grid">
        {shown.map((animal) => (
          <HappyEndingCard key={animal._id} animal={animal} />
        ))}
      </ul>
      <Link
        href="/happy-endings"
        className="outlined-button font-bold self-start"
      >
        <Heart aria-hidden="true" className="size-5" />
        {t("viewAll")}
      </Link>
    </section>
  );
}
