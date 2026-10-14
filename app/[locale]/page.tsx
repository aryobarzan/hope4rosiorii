import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import HighlightedAnimal, {
  HighlightedAnimalSkeleton,
} from "./components/HighlightedAnimal";
import FeaturedAnimals from "./components/FeaturedAnimals";
import MeetTheDogsButton from "./components/MeetTheDogsButton";
import RecentUpdates from "./components/RecentUpdates";
import SectionHeading from "./components/SectionHeading";
import { UserGroup, HandCoins } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getVolunteers } from "@/lib/volunteers";

// No title: the layout's default ("Hope 4 Rosiorii") is the right one for the
// home page, so only the description is translated.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("HomePage.metadata");
  return { description: t("description") };
}

export default function Home() {
  const t = useTranslations("HomePage");
  const volunteers = getVolunteers();

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="page-container page-section flex flex-col gap-8 md:flex-row">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <p className="font-heading text-xl text-link">{t("eyebrow")}</p>
            <h1 className="font-heading text-6xl font-bold">
              {t.rich("heading", {
                accent: (chunks) => (
                  <span className="text-brand underline decoration-wavy decoration-4 underline-offset-8 px-1 decoration-brand">
                    {chunks}
                  </span>
                ),
              })}
            </h1>
          </div>
          <p className="font-body">{t("description")}</p>
          <Suspense>
            <MeetTheDogsButton />
          </Suspense>
        </div>

        <Suspense fallback={<HighlightedAnimalSkeleton />}>
          <HighlightedAnimal />
        </Suspense>
      </section>
      {/* Adoption steps */}
      <section className="w-full bg-button">
        <div className="page-container page-section section-stack">
          <SectionHeading heading={t("adoptionHeading")} light />
          <div className="animal-status-card-grid">
            {["1", "2", "3", "4"].map((step) => (
              <div key={`AdoptionStep-${step}`} className="prominent-link-card">
                <div className="flex flex-col">
                  {" "}
                  <p className="font-heading text-2xl">0{step}</p>
                  <p className="font-heading text-2xl">
                    {t(`adoptionSteps.${step}.title`)}
                  </p>
                </div>
                <p className="text-sm">
                  {t(`adoptionSteps.${step}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Featured animals */}
      <Suspense>
        <FeaturedAnimals />
      </Suspense>
      {/* Featured volunteers */}
      <section className="w-full bg-pale">
        <div className="page-container page-section section-stack">
          <SectionHeading heading={t("volunteers.heading")} />
          {/* Deliberately not cards (unlike the about page): just a photo and a
              name. */}
          <ul className="flex flex-wrap justify-evenly gap-6">
            {volunteers.map((volunteer) => (
              <li
                key={volunteer.id}
                className="flex w-28 flex-col items-center gap-2"
              >
                {/* TODO: real photo (next/image, empty alt as the name follows) */}
                <div className="picture-placeholder blob-frame h-24 w-24 bg-brand" />
                <p className="text-balance text-center font-heading text-2xl font-bold">
                  {volunteer.name}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href={{ pathname: `/about` }}
            className="outlined-button font-bold self-start"
          >
            {<UserGroup aria-hidden="true" className="size-5" />}

            {t("volunteers.meetAll")}
          </Link>
        </div>
      </section>
      {/* Featured donation updates. */}
      <section className="page-container page-section flex flex-col gap-8 md:flex-row">
        <div className="section-stack w-full">
          <SectionHeading
            eyebrow={t("donations.eyebrow")}
            heading={t("donations.heading")}
          />
          <Suspense>
            <RecentUpdates />
          </Suspense>
          <Link
            href={{ pathname: `/donate` }}
            className="filled-button font-bold self-start"
          >
            {<HandCoins aria-hidden="true" className="size-5" />}

            {t("donations.donate")}
          </Link>
        </div>
      </section>
    </div>
  );
}
