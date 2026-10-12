import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { getCountryOptions } from "@/lib/countries";
import { getDog } from "@/lib/dogs";
import AdoptForm from "./AdoptForm";
const stepClass =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-white font-heading text-ink text-xl";

// With cacheComponents, searchParams is runtime data and must be read inside
// <Suspense>. Isolating it here keeps the rest of the page prerendered; only
// the form streams in. An unknown or repeated slug is ignored.
async function PrefilledAdoptForm({
  searchParams,
  countries,
}: {
  searchParams: Promise<{ dog?: string | string[] }>;
  countries: ReturnType<typeof getCountryOptions>;
}) {
  const { dog: slug } = await searchParams;
  const dog = typeof slug === "string" ? await getDog(slug) : undefined;
  // key: useForm only reads defaultValues on mount, so a different dog has to
  // remount the form or the previous dog's name would stay in the field.
  return (
    <AdoptForm
      key={dog?.slug ?? "no-dog"}
      countries={countries}
      dogName={dog?.name}
    />
  );
}

export default async function Adopt({
  searchParams,
}: {
  searchParams: Promise<{ dog?: string | string[] }>;
}) {
  const t = await getTranslations("AdoptPage");
  const locale = await getLocale();
  const countries = getCountryOptions(locale);

  return (
    <div className="page-container flex flex-col gap-1 pb-8 pt-8">
      <p className="font-heading text-xl text-link">{t("eyebrow")}</p>
      <h1 className="font-heading text-5xl">{t("heading")}</h1>
      {/* Stacked on small screens; side by side from lg. items-start stops the
          box stretching to the form's height, so it only takes what it needs. */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* The fallback is the plain form, so the layout does not jump. */}
        <Suspense fallback={<AdoptForm countries={countries} />}>
          <PrefilledAdoptForm
            searchParams={searchParams}
            countries={countries}
          />
        </Suspense>
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
