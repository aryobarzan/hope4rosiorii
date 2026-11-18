import type { Metadata } from "next";
import { getPosts } from "@/lib/posts";
import { getLocale, getTranslations } from "next-intl/server";
import NewsList from "./NewsList";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NewsPage.metadata");
  return { title: t("title"), description: t("description") };
}

export default async function News() {
  const locale = await getLocale();
  const t = await getTranslations("NewsPage");
  const posts = await getPosts(locale);
  return (
    <div className="page-container page-section section-stack">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-5xl">{t("title")}</h1>
        <p>{t("intro")}</p>
      </div>
      <NewsList posts={posts} locale={locale} />
    </div>
  );
}
