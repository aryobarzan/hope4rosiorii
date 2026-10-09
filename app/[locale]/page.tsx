import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");
  return <h1 className="text-3xl font-semibold">{t("title")}</h1>;
}
