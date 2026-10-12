import { useTranslations } from "next-intl";

const dogs = [
  {
    id: 1,
    name: "Bali",
    age: "ca. 3 months",
    size: "Medium-sized",
    type: "Puppy",
    personality: "Friendly",
    description: "Quiet and loyal.",
  },
  {
    id: 2,
    name: "Luna",
    age: "ca. 4 years",
    size: "Small-sized",
    type: "Puppy",
    personality: "Calm",
  },
  {
    id: 3,
    name: "Mara",
    age: "ca. 5 years",
    size: "Large-sized",
    type: "Husky",
    personality: "Gentle",
    description: "Quiet and loyal.",
  },
  {
    id: 4,
    name: "Pichi",
    age: "ca. 8 months",
    size: "Small-sized",
    type: "Puppy",
    personality: "Curious",
    description: "Loves long hikes.",
  },
];

export default function Dogs() {
  const t = useTranslations("DogsPage");
  return (
    <div className="page-container flex flex-col gap-1 pb-8 pt-8">
      <p className="font-heading text-xl text-link">{t("eyebrow")}</p>
      <h1 className="font-heading text-5xl">{t("heading")}</h1>
      <p>{t("description")}</p>
      <ul className="dog-grid pt-4">
        {dogs.map((dog) => (
          <li key={dog.id} className="dog-card">
            <p className="text-link font-bold font-heading text-xl">
              {t("card.adoptMe")}
            </p>
            <p className="font-heading text-4xl font-bold">{dog.name}</p>

            {/* Fills the card up to 18rem and stays square. A fixed w-72 overflowed
                cards narrower than 288px (e.g. on phones). */}
            <div className="picture-placeholder blob-frame aspect-square w-full max-w-72" />
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
            <button className="filled-button mt-auto w-full font-bold">
              {t("card.ask", { name: dog.name })}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// TODO: adopted field
// TODO: adoption form link
// TODO: additional dog info / separate dog specific page
// TODO: dog selected preview in contact / adopt pages
