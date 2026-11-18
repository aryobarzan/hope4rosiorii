import { useTranslations } from "next-intl";
import { Calendar, ChevronRight, PawPrint } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Post } from "@/lib/posts";
import { formatPostDate } from "@/lib/post-date";
import { excerpt } from "@/lib/portable-text";
import SanityImage from "./SanityImage";

export default function PostCard({
  post,
  locale,
}: {
  post: Post;
  locale: string;
}) {
  const t = useTranslations("NewsPage.card");
  const summary = excerpt(post.body, 140);

  return (
    <li>
      <Link
        href={{ pathname: `/news/${post.slug}` }}
        className="post-card"
      >
        {/* min-w-0 lets this row shrink below its content width, so a long
            word cannot push the card past the edge of a phone screen. */}
        <div className="flex min-w-0 flex-row gap-4">
          <div className="picture-placeholder blob-frame relative grid aspect-square w-20 shrink-0 place-items-center sm:w-28">
            {post.coverImage && post.coverImage.url ? (
              <SanityImage
                src={post.coverImage.url}
                alt={post.coverImage.alt ?? ""}
                sizes="112px"
                hotspot={post.coverImage.hotspot}
              />
            ) : (
              // No photo yet: a paw instead of an empty blob.
              <PawPrint aria-hidden="true" className="size-1/3 text-brand" />
            )}
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-1 wrap-anywhere">
            <p className="font-body text-2xl font-bold">
              {post.title ?? t("untitled")}
            </p>
            {post.publishedAt && (
              <span className="flex flex-row items-start gap-1.5">
                <Calendar aria-hidden="true" className="mt-1 size-4 shrink-0" />
                <time dateTime={post.publishedAt}>
                  {formatPostDate(post.publishedAt, locale)}
                </time>
              </span>
            )}
            {summary && <p className="line-clamp-2">{summary}</p>}
          </div>
        </div>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
      </Link>
    </li>
  );
}
