import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <div className="page-container">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
    </div>
  );
}
