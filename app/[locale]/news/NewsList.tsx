import { getTranslations } from "next-intl/server";
import { Post } from "@/lib/posts";
import PostCard from "../components/PostCard";

// Unlike EventList, nothing here depends on the current time, so there is no
// `io()` and no <Suspense>: the list is part of the static shell and only
// changes when the Sanity webhook revalidates the "post" tag.
export default async function NewsList({
  posts,
  locale,
}: {
  posts: Post[];
  locale: string;
}) {
  const t = await getTranslations("NewsPage");

  if (posts.length === 0) return <p>{t("noPosts")}</p>;

  return (
    <ul className="post-list">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} locale={locale} />
      ))}
    </ul>
  );
}
