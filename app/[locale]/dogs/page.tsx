import { getTranslations } from "next-intl/server";
import { PawPrint, CircleQuestionMark } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDogs } from "@/lib/dogs";

const adoptBadge = "text-link font-bold font-heading text-xl";
const adoptedBadge =
  "bg-white rounded-full text-link px-2 font-bold font-heading text-xl";

export default async function Dogs() {
  const t = await getTranslations("DogsPage");
  const dogs = await getDogs();
  // Adoptable dogs first, adopted dogs last
  const sortedDogs = dogs.toSorted(
    (a, b) => (a.adopted ? 1 : 0) - (b.adopted ? 1 : 0),
  );
  return (
    <div className="page-container flex flex-col gap-1 pb-8 pt-8">
      <p className="font-heading text-xl text-link">{t("eyebrow")}</p>
      <h1 className="font-heading text-5xl">{t("heading")}</h1>
      <p>{t("description")}</p>
      <ul className="dog-grid pt-4">
        {sortedDogs.map((dog) => (
          <li key={dog.id} className="dog-card" data-adopted={dog.adopted}>
            <p className={dog.adopted ? adoptedBadge : adoptBadge}>
              {dog.adopted ? t("card.adopted") : t("card.adoptMe")}
            </p>
            <p className="font-heading text-4xl font-bold">{dog.name}</p>

            {/* Fills the card up to 18rem and stays square. A fixed w-72 overflowed
                cards narrower than 288px (e.g. on phones). */}
            <div
              className={`picture-placeholder blob-frame aspect-square w-full max-w-72 ${dog.adopted ? `bg-link` : ``}`}
            />
            <p className="font-heading text-2xl font-bold">{dog.age}</p>
            {/* The card's align-items: center centres this paragraph's box, not
                the text inside it. text-center centres each wrapped line, and
                text-balance evens out the line lengths, so a wrap does not
                leave one long line and a single orphaned word. */}
            <p className="text-balance text-center font-heading text-2xl">
              {dog.size} • {dog.type} • {dog.personality}
            </p>
            {dog.description && <p className="font-body">{dog.description}</p>}
            {/* mt-auto: an automatic top margin takes all the free space in this
                flex column, which pushes the button to the card's bottom edge
                (cards in a row are equally tall), even without a description. */}
            {!dog.adopted && (
              <div className="mt-auto flex w-full flex-col gap-1">
                <Link
                  href={{ pathname: "/contact", query: { dog: dog.slug } }}
                  className="outlined-button font-bold"
                >
                  <CircleQuestionMark aria-hidden="true" className="size-5" />
                  {t("card.ask", { name: dog.name })}
                </Link>
                <Link
                  href={{ pathname: "/adopt", query: { dog: dog.slug } }}
                  className="filled-button font-bold"
                >
                  <PawPrint aria-hidden="true" className="size-5" />
                  {t("card.adopt", { name: dog.name })}
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-pale text-ink rounded-4xl px-6 py-6 mt-8">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-2xl font-heading">{t("help.title")}</p>
          <p>{t("help.body")}</p>
        </div>
        <Link
          href="/adopt"
          className="filled-button filled-button-ink font-bold ml-auto shrink-0"
        >
          {t("help.cta")}
        </Link>
      </div>
    </div>
  );
}

// TODO: adoption form link
// TODO: additional dog info / separate dog specific page
// TODO: dog selected preview in contact / adopt pages
