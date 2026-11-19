import { Newspaper } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLatestPosts } from "@/lib/posts";
import PostCard from "./PostCard";
import SectionHeading from "./SectionHeading";

const MAX_POSTS = 2;

// The home page's news section: the newest posts (the query already sorts them
// newest first). Left out entirely when there are no posts yet.
export default async function LatestNewsSection() {
  const locale = await getLocale();
  const t = await getTranslations("HomePage.news");
  const posts = await getLatestPosts(locale, MAX_POSTS);

  if (posts.length === 0) return null;

  return (
    <section className="page-container page-section tight-section section-stack">
      <SectionHeading heading={t("heading")} />
      <ul className="post-list">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} locale={locale} />
        ))}
      </ul>
      <Link href="/news" className="outlined-button font-bold self-start">
        <Newspaper aria-hidden="true" className="size-5" />
        {t("viewAll")}
      </Link>
    </section>
  );
}
