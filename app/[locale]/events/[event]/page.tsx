import { getEvent, getEvents } from "@/lib/events";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SanityImage from "../../components/SanityImage";
import PortableTextBody from "../../components/PortableTextBody";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  PawPrint,
} from "lucide-react";
import { formatEventParts } from "@/lib/event-time";
import { excerpt } from "@/lib/portable-text";
import { safeHttpUrl } from "@/lib/safe-url";
import { Link } from "@/i18n/navigation";
import EventStatusPill from "../EventStatusPill";
import ShareButton from "../ShareButton";
import AddToCalendar from "../AddToCalendar";
import { googleCalendarUrl, toCalendarEvent } from "@/lib/event-calendar";

// Opt out of instant-navigation validation (dev-only, never blocks the build).
// Everything on this page depends on `params`, so there is no useful shell to
// show before the event is known. Known events are prerendered by
// generateStaticParams below. An event the build did not prerender starts
// streaming at once with status 200, so an unknown slug cannot answer a real
// 404 from here: proxy.ts checks the slug first (lib/slug-exists.ts) and
// rewrites unknown ones to the 404 page. notFound() below is only the
// fallback. Only the status pill needs the current time, so it is a separate
// <Suspense> component and the rest of the page stays static.
export const instant = false;

// Prerender one page per event and locale at build time. Slugs are the same
// in every locale, so the default locale's list is enough. Events added
// later are rendered on first visit and then cached.
export async function generateStaticParams() {
  const events = await getEvents(routing.defaultLocale);
  // The generated type allows a null slug; a page without one has no URL.
  const slugs = events.flatMap((event) => (event.slug ? [event.slug] : []));
  const params = routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, event: slug })),
  );
  // With cacheComponents, an empty list is a build error. Next's documented
  // workaround is a placeholder param, which the page turns into a 404.
  return params.length > 0
    ? params
    : routing.locales.map((locale) => ({ locale, event: "__placeholder__" }));
}

// Title and description come from the event itself (CMS content). An unknown slug
// returns nothing here; the page itself answers with notFound().
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; event: string }>;
}): Promise<Metadata> {
  const { locale, event: slug } = await params;
  const event = await getEvent(slug, locale);
  if (!event) return {};
  // The typed translator wants a known locale, not a plain string.
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "EventPage",
  });
  const title = event.title ?? t("untitled");
  const description = excerpt(event.body);
  const photoUrl = event.coverImage?.url;
  return {
    title,
    description,
    // A cancelled event stays reachable by its link but is kept out of search.
    robots: event.cancelled ? { index: false } : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      images: photoUrl ? [{ url: photoUrl }] : undefined,
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; event: string }>;
}) {
  const { locale, event: slug } = await params;

  const event = await getEvent(slug, locale);
  if (!event) notFound();
  const t = await getTranslations("EventPage");
  const title = event.title ?? t("untitled");
  const { start, end } = formatEventParts(event, locale);
  const cancelled = event.cancelled === true;
  const calendarEvent = toCalendarEvent(event, { slug, locale, title });
  const externalUrl = safeHttpUrl(event.externalUrl);
  const mapUrl = safeHttpUrl(event.location?.mapUrl);
  const location = [
    event.location?.name ?? null,
    event.location?.address ?? null,
  ]
    .filter((elem) => elem != null)
    .join(" - ");

  return (
    <article className="flex flex-col w-full">
      <section className="page-container page-section items-start flex flex-col gap-2">
        <Link href="/events" className="back-link">
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("backToEvents")}
        </Link>
        <div className="event-card-photo relative picture-placeholder blob-frame grid aspect-square place-items-center w-64 shrink-0 sm:w-96 self-center">
          {event.coverImage && event.coverImage.url ? (
            <SanityImage
              src={event.coverImage.url}
              alt={event.coverImage.alt ?? ""}
              sizes="384px"
              hotspot={event.coverImage.hotspot}
            />
          ) : (
            <PawPrint aria-hidden="true" className="size-1/3 text-brand" />
          )}
        </div>
        <h1 className="text-5xl">{title}</h1>
        <p className="mt-1 flex flex-row items-start gap-2 text-lg font-semibold">
          <Calendar
            aria-hidden="true"
            className="mt-1 size-5 shrink-0 text-brand"
          />
          <span>
            <time dateTime={event.startDate}>{start}</time>
            {end && event.endDate && (
              <>
                {" – "}
                <time dateTime={event.endDate}>{end}</time>
              </>
            )}
          </span>
        </p>
        {location.length > 0 && (
          <p className="flex flex-row items-start gap-2 text-lg font-semibold">
            <MapPin
              aria-hidden="true"
              className="mt-1 size-5 shrink-0 text-brand"
            />
            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link underline underline-offset-2"
              >
                {location}
                <span className="sr-only"> {t("opensInNewTab")}</span>
              </a>
            ) : (
              <span>{location}</span>
            )}
          </p>
        )}
        <Suspense fallback={null}>
          <EventStatusPill
            startDate={event.startDate}
            endDate={event.endDate}
            cancelled={event.cancelled === true}
          />
        </Suspense>
      </section>
      <section className="w-full bg-pale">
        <div className="page-container page-section section-stack">
          {/* Body */}
          {event.body && <PortableTextBody value={event.body} />}
          {/* Buttons: Share, Add to calendar, Learn more */}
          <div className="flex flex-row flex-wrap gap-2 sm:justify-end">
            <ShareButton title={title} />
            {!cancelled && (
              <AddToCalendar
                googleUrl={googleCalendarUrl(calendarEvent)}
                icsUrl={`/${locale}/events/${encodeURIComponent(slug)}/calendar.ics`}
              />
            )}
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="filled-button font-bold"
              >
                <ExternalLink aria-hidden="true" className="size-5" />
                {t("learnMore")}
                <span className="sr-only"> {t("opensInNewTab")}</span>
              </a>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}
