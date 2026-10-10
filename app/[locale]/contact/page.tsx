import { useTranslations } from "next-intl";
import ContactForm from "./ContactForm";

export default function Contact() {
  const t = useTranslations("ContactPage");

  return (
    <div className="flex flex-col gap-1 pb-8 pt-8">
      <p className="font-heading text-xl text-brand">{t("eyebrow")}</p>
      <h1 className="font-heading text-5xl">{t("heading")}</h1>
      <ContactForm />
    </div>
  );
}
