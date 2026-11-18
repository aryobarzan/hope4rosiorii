// Date formatting for news posts. Pure, so tests can import it without the
// Sanity client. Like events, the day is the Luxembourg one: a post published
// at 23:30 UTC must not show as the next day's date on a server running in UTC.
import { EVENT_TIME_ZONE } from "@/lib/event-time";

export function formatPostDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: EVENT_TIME_ZONE,
  }).format(new Date(iso));
}
