// "Add to calendar" for events: a Google Calendar link and an .ics file (the
// format Apple Calendar, Outlook and most others import). Pure functions, no
// Sanity or Next imports, so they are easy to test.
//
// Times are written in UTC ("...Z"): the stored start is an absolute instant,
// and every calendar shows it in the visitor's own time zone. That avoids a
// VTIMEZONE block. All-day events name a calendar day instead (Luxembourg's).
//
// An event without an end date gets no end in the .ics file (valid, the
// calendar chooses a default). We do not invent a duration.
import { luxembourgDay } from "@/lib/event-time";
import { excerpt } from "@/lib/portable-text";
import { siteUrl } from "@/lib/site-url";
import type { Event } from "@/lib/events";

export type CalendarEvent = {
  slug: string;
  title: string;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  cancelled: boolean;
  /** "Name - address", or empty */
  location: string;
  /** Plain text, may be empty */
  description: string;
  /** Absolute address of the event page */
  url: string;
};

// Builds the calendar's view of a CMS event. `title` is passed in because the
// fallback for an untitled event is a translated message.
export function toCalendarEvent(
  event: Event,
  { slug, locale, title }: { slug: string; locale: string; title: string },
): CalendarEvent {
  return {
    slug,
    title,
    startDate: event.startDate,
    endDate: event.endDate,
    allDay: event.allDay === true,
    cancelled: event.cancelled === true,
    location: [event.location?.name, event.location?.address]
      .filter((part): part is string => Boolean(part))
      .join(" - "),
    description: excerpt(event.body, 500) ?? "",
    url: `${siteUrl}/${locale}/events/${encodeURIComponent(slug)}`,
  };
}

// 2026-12-06T13:00:00.000Z -> 20261206T130000Z
function utcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// "20261206" plus one day, via UTC so month ends and leap days just work
function nextDay(yyyymmdd: string) {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  return new Date(Date.UTC(y, m - 1, d + 1))
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");
}

const compactDay = (iso: string) => luxembourgDay(iso).replaceAll("-", "");

// Start and end in calendar notation. An all-day end is exclusive: the day
// after the last day.
function calendarTimes(e: CalendarEvent) {
  if (e.allDay) {
    const start = compactDay(e.startDate);
    const lastDay = e.endDate ? compactDay(e.endDate) : start;
    return { allDay: true as const, start, end: nextDay(lastDay) };
  }
  return {
    allDay: false as const,
    start: utcStamp(new Date(e.startDate)),
    end: e.endDate ? utcStamp(new Date(e.endDate)) : null,
  };
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const times = calendarTimes(e);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    // Google wants both ends. Without an end date, start and end are the same.
    dates: `${times.start}/${times.end ?? times.start}`,
    details: [e.description, e.url].filter(Boolean).join("\n\n"),
  });
  if (e.location) params.set("location", e.location);
  return `https://calendar.google.com/calendar/render?${params}`;
}

// Text values: escape backslash, semicolon, comma and newlines (RFC 5545)
function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const encoder = new TextEncoder();

// Lines may be at most 75 bytes (not characters: "é" is two). Longer ones
// continue on the next line, which starts with one space.
function fold(line: string) {
  const lines: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) {
      lines.push(current);
      current = " ";
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  lines.push(current);
  return lines.join("\r\n");
}

export function buildEventIcs(e: CalendarEvent, now: Date): string {
  const times = calendarTimes(e);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hope 4 Rosiorii//Website//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // Stable, so downloading again updates the entry instead of duplicating it
    `UID:${e.slug}@${new URL(siteUrl).hostname}`,
    `DTSTAMP:${utcStamp(now)}`,
    times.allDay
      ? `DTSTART;VALUE=DATE:${times.start}`
      : `DTSTART:${times.start}`,
    ...(times.end
      ? [
          times.allDay
            ? `DTEND;VALUE=DATE:${times.end}`
            : `DTEND:${times.end}`,
        ]
      : []),
    `SUMMARY:${escapeText(e.title)}`,
    ...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
    ...(e.description ? [`DESCRIPTION:${escapeText(e.description)}`] : []),
    `URL:${e.url}`,
    `STATUS:${e.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
