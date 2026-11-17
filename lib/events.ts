// Data access for events. Components call getEvents / getEvent, never the
// Sanity client. Tagged "event" for the revalidation webhook
// (app/api/revalidate/route.ts).
//
// getEvents returns every event. "Upcoming" depends on the current time, so
// split them while rendering with splitEvents(events, new Date()) from
// lib/event-time.ts.
import { cacheLife, cacheTag } from "next/cache";
import { client } from "@/lib/sanity/client";
import type { EVENTS_QUERY_RESULT } from "@/sanity.types";
import { EVENTS_QUERY } from "@/lib/sanity/queries";

// TypeGen does not narrow on the query's defined(startDate) filter, so the type
// is refined here: every Event has a start date.
export type Event = Omit<EVENTS_QUERY_RESULT[number], "startDate"> & {
  startDate: string;
};

export async function getEvents(locale: string): Promise<Event[]> {
  "use cache";
  cacheTag("event");
  // Safe to cache for long: the data has no "now" in it.
  cacheLife("max");
  const events = await client.fetch<EVENTS_QUERY_RESULT>(EVENTS_QUERY, {
    locale,
  });
  return events.filter((e): e is Event => e.startDate !== null);
}

export async function getEvent(slug: string, locale: string) {
  const events = await getEvents(locale);
  return events.find((event) => event.slug === slug);
}
