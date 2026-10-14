import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NotFound");
  return { title: t("title") };
}

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <div className="page-container page-section flex flex-col items-center gap-2">
      <h1 className="font-heading text-3xl">{t("title")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
