import { getPost, getPosts } from "@/lib/posts";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, PawPrint } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { excerpt } from "@/lib/portable-text";
import { formatPostDate } from "@/lib/post-date";
import SanityImage from "../../components/SanityImage";
import PortableTextBody from "../../components/PortableTextBody";
import ShareButton from "../../components/ShareButton";

// Opt out of instant-navigation validation (dev-only, never blocks the build),
// for the same reason as the event page: everything here depends on `params`,
// so there is no useful shell to show before the post is known. Unknown slugs
// get their real 404 from proxy.ts; notFound() below is only the fallback.
export const instant = false;

// Prerender one page per post and locale at build time. Slugs are the same in
// every locale, so the default locale's list is enough. Posts added later are
// rendered on first visit and then cached.
export async function generateStaticParams() {
  const posts = await getPosts(routing.defaultLocale);
  const slugs = posts.flatMap((post) => (post.slug ? [post.slug] : []));
  const params = routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, post: slug })),
  );
  // With cacheComponents, an empty list is a build error. Next's documented
  // workaround is a placeholder param, which the page turns into a 404.
  return params.length > 0
    ? params
    : routing.locales.map((locale) => ({ locale, post: "__placeholder__" }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; post: string }>;
}): Promise<Metadata> {
  const { locale, post: slug } = await params;
  const post = await getPost(slug, locale);
  if (!post) return {};
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "PostPage",
  });
  const title = post.title ?? t("untitled");
  const description = excerpt(post.body);
  const photoUrl = post.coverImage?.url;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      images: photoUrl ? [{ url: photoUrl }] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; post: string }>;
}) {
  const { locale, post: slug } = await params;

  const post = await getPost(slug, locale);
  if (!post) notFound();
  const t = await getTranslations("PostPage");
  const title = post.title ?? t("untitled");
  // Links to related content. A reference whose target has no slug has no
  // page, so it is left out.
  const event = post.relatedEvent?.slug ? post.relatedEvent : null;
  const animals = (post.relatedAnimals ?? []).flatMap((animal) =>
    animal.slug && animal.name ? [{ slug: animal.slug, name: animal.name }] : [],
  );

  return (
    <article className="flex flex-col w-full">
      <section className="page-container page-section items-start flex flex-col gap-2">
        <Link href="/news" className="back-link">
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("backToNews")}
        </Link>
        <div className="picture-placeholder blob-frame relative grid aspect-square w-64 shrink-0 place-items-center self-center sm:w-96">
          {post.coverImage && post.coverImage.url ? (
            <SanityImage
              src={post.coverImage.url}
              alt={post.coverImage.alt ?? ""}
              sizes="384px"
              hotspot={post.coverImage.hotspot}
            />
          ) : (
            <PawPrint aria-hidden="true" className="size-1/3 text-brand" />
          )}
        </div>
        <h1 className="text-5xl">{title}</h1>
        {post.publishedAt && (
          <p className="mt-1 flex flex-row items-start gap-2 text-lg font-semibold">
            <Calendar
              aria-hidden="true"
              className="mt-1 size-5 shrink-0 text-brand"
            />
            <time dateTime={post.publishedAt}>
              {formatPostDate(post.publishedAt, locale)}
            </time>
          </p>
        )}
      </section>
      <section className="w-full bg-pale">
        <div className="page-container page-section section-stack">
          {post.body && <PortableTextBody value={post.body} />}

          {event && (
            <div className="flex flex-col items-start gap-2">
              <h2 className="font-heading text-3xl">{t("relatedEvent")}</h2>
              <Link href={`/events/${event.slug}`} className="outlined-button">
                {event.title ?? t("untitledEvent")}
              </Link>
            </div>
          )}

          {animals.length > 0 && (
            <div className="flex flex-col items-start gap-2">
              <h2 className="font-heading text-3xl">{t("relatedAnimals")}</h2>
              <ul className="flex flex-row flex-wrap gap-2">
                {animals.map((animal) => (
                  <li key={animal.slug}>
                    <Link
                      href={`/animals/${animal.slug}`}
                      className="outlined-button"
                    >
                      {animal.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-row flex-wrap gap-2 sm:justify-end">
            <ShareButton title={title} />
          </div>
        </div>
      </section>
    </article>
  );
}
