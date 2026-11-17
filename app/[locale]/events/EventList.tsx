import { io } from "next/cache";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Event } from "@/lib/events";
import { eventStatus, splitEvents } from "@/lib/event-time";
import EventCard from "../components/EventCard";

export default async function EventList({
  events,
  locale,
}: {
  events: Event[];
  locale: string;
}) {
  // By default, the EventList would be pre-rendered during build time, as
  // `next.config.ts` sets `cacheComponents: true`, which means a static shell of every page
  // is built during build time. This would be wrong for this list, as we need to read the
  // current date and time, which should not be frozen into the pre-built shell. Either way,
  // without io(), Next.js would have failed the build anyway due to the bare new Date() usage.

  // What await io() does: stop pre-rendering this component at this line (the build itself carries on),
  // so the rest of this component is rendered dynamically.
  // When this component is requested by a visitor, it is dynamically rendered, hence why the entire EventList
  // is wrapped in a Suspense in the events page. The suspense fallback (EventListSkeleton) is pre-rendered
  // into the static shell.

  // NOTE: the data does stay cached, as we do use "use cache" and "cacheLife(max)" for the actual sanity queries
  // in the getEvents function. The aspect not cached is the dynamic split between upcoming and past events, which
  // relies on the dynamic `now` date.

  await io();
  const now = new Date();
  const t = await getTranslations("EventsPage");
  const { upcoming, past } = splitEvents(events, now);

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-3xl">{t("upcomingHeading")}</h2>
        {upcoming.length > 0 ? (
          <ul className="event-list">
            {upcoming.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                locale={locale}
                status={eventStatus(event, now)}
              />
            ))}
          </ul>
        ) : (
          <p>{t("noUpcoming")}</p>
        )}
      </section>

      {past.length > 0 && (
        // A native <details>: collapsed archive, keyboard and screen reader
        // support for free, and no JavaScript.
        <details className="event-archive">
          <summary>
            {t("pastHeading", { count: past.length })}
            {/* Points down when closed, turns up when open (see globals.css) */}
            <ChevronDown aria-hidden="true" className="event-archive-arrow" />
          </summary>
          <ul className="event-list">
            {past.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                locale={locale}
                status="past"
              />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
