import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

type Section = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

// Reuses the page's own title and intro, so there are no extra messages.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PrivacyPage");
  return { title: t("title"), description: t("intro") };
}

// The policy lives in the message files as an ordered array of sections, so
// adding or reordering a section only touches the JSON, not this component.
// `t.raw` is needed because `t()` only returns strings, not arrays.
export default function PrivacyPolicy() {
  const t = useTranslations("PrivacyPage");
  const sections = t.raw("sections") as Section[];

  return (
    <div className="page-container pb-8 pt-8">
      <h1 className="font-heading text-3xl">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("intro")}</p>

      {sections.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="font-heading text-2xl">{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-3">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
