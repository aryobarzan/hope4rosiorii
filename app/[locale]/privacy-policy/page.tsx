import { useTranslations } from "next-intl";

// Placeholder until the association provides the real privacy notice text
export default function PrivacyPolicy() {
  const t = useTranslations("PrivacyPage");
  return (
    <div>
      <h1 className="font-heading text-3xl">{t("title")}</h1>
      <p>{t("placeholder")}</p>
    </div>
  );
}
