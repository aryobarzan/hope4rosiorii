import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("AnimalPage");
  return <div>{t("notFound")}</div>;
}
