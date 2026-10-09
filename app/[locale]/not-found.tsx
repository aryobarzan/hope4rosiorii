import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <div className="flex flex-col items-center gap-2">
      <h1 className="font-heading text-3xl">{t("title")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
