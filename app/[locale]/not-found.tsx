import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("NotFound");
  <main className="flex flex-1 items-center justify-center">
    <h1 className="text-3xl font-semibold">{t("title")}</h1>
    <p>{t("description")}</p>
  </main>;
}
