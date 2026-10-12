import { getLocale, getTranslations } from "next-intl/server";
import { getCountryOptions } from "@/lib/countries";
import { getDog } from "@/lib/dogs";
import AdoptForm from "./AdoptForm";
const stepClass =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-white font-heading text-ink text-xl";

export default async function Adopt({
  searchParams,
}: {
  searchParams: Promise<{ dog?: string | string[] }>;
}) {
  const t = await getTranslations("AdoptPage");
  const locale = await getLocale();
  // Reading searchParams makes this page dynamic. An unknown slug is ignored.
  const { dog: slug } = await searchParams;
  const dog = typeof slug === "string" ? await getDog(slug) : undefined;

  return (
    <div className="page-container flex flex-col gap-1 pb-8 pt-8">
      <p className="font-heading text-xl text-link">{t("eyebrow")}</p>
      <h1 className="font-heading text-5xl">{t("heading")}</h1>
      {/* Stacked on small screens; side by side from lg. items-start stops the
          box stretching to the form's height, so it only takes what it needs. */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        <AdoptForm countries={getCountryOptions(locale)} dogName={dog?.name} />
        <div className="flex flex-col gap-2 prominent-box">
          <p className="font-heading text-2xl">{t("next.heading")}</p>
          <span className="flex gap-2">
            <span className={`${stepClass}`}>1</span>{" "}
            <p className="font-body">{t("next.step1")}</p>
          </span>
          <span className="flex gap-2">
            <span className={`${stepClass}`}>2</span>{" "}
            <p className="font-body">{t("next.step2")}</p>
          </span>
          <span className="flex gap-2">
            <span className={`${stepClass}`}>3</span>{" "}
            <p className="font-body">{t("next.step3")}</p>
          </span>
        </div>
      </div>
    </div>
  );
}
