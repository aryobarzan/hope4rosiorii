import { describe, expect, it } from "vitest";
import {
  buildEventIcs,
  googleCalendarUrl,
  type CalendarEvent,
} from "@/lib/event-calendar";

const make = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  slug: "christmas-market",
  title: "Christmas market",
  startDate: "2026-12-06T13:00:00Z",
  endDate: "2026-12-06T16:00:00Z",
  allDay: false,
  cancelled: false,
  location: "Town hall - 1 Rue Test, Luxembourg",
  description: "Come and say hi.",
  url: "https://hope4rosiorii.lu/en/events/christmas-market",
  ...over,
});

const NOW = new Date("2026-11-18T10:00:00Z");
const lines = (ics: string) => ics.split("\r\n");

describe("buildEventIcs", () => {
  it("builds a timed event in UTC with CRLF line endings", () => {
    const ics = buildEventIcs(make(), NOW);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
    expect(lines(ics)).toContain("DTSTART:20261206T130000Z");
    expect(lines(ics)).toContain("DTEND:20261206T160000Z");
    expect(lines(ics)).toContain("DTSTAMP:20261118T100000Z");
    expect(lines(ics)).toContain("STATUS:CONFIRMED");
  });

  it("has a stable UID built from the slug and the site host", () => {
    expect(buildEventIcs(make(), NOW)).toContain(
      "UID:christmas-market@hope4rosiorii.lu",
    );
  });

  it("leaves out the end when the event has none", () => {
    const ics = buildEventIcs(make({ endDate: null }), NOW);
    expect(ics).not.toContain("DTEND");
  });

  it("uses Luxembourg days for all-day events, with an exclusive end", () => {
    const ics = buildEventIcs(
      // 23:30 UTC on the 5th is already the 6th in Luxembourg
      make({ allDay: true, startDate: "2026-12-05T23:30:00Z", endDate: null }),
      NOW,
    );
    expect(lines(ics)).toContain("DTSTART;VALUE=DATE:20261206");
    expect(lines(ics)).toContain("DTEND;VALUE=DATE:20261207");
  });

  it("ends a multi-day all-day event the day after its last day", () => {
    const ics = buildEventIcs(
      make({
        allDay: true,
        startDate: "2026-12-30T10:00:00Z",
        endDate: "2026-12-31T10:00:00Z",
      }),
      NOW,
    );
    expect(lines(ics)).toContain("DTEND;VALUE=DATE:20270101");
  });

  it("escapes commas, semicolons, backslashes and newlines", () => {
    const ics = buildEventIcs(
      make({ title: "A, B; C \\ D", description: "line1\nline2" }),
      NOW,
    );
    expect(ics).toContain("SUMMARY:A\\, B\\; C \\\\ D");
    expect(ics).toContain("DESCRIPTION:line1\\nline2");
  });

  it("folds long lines at 75 bytes, counting accented letters as two", () => {
    const ics = buildEventIcs(make({ description: "é".repeat(100) }), NOW);
    const encoder = new TextEncoder();
    for (const line of lines(ics)) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    // Unfolding gives the text back unchanged
    expect(ics.replace(/\r\n /g, "")).toContain(`DESCRIPTION:${"é".repeat(100)}`);
  });

  it("marks a cancelled event", () => {
    expect(buildEventIcs(make({ cancelled: true }), NOW)).toContain(
      "STATUS:CANCELLED",
    );
  });

  it("leaves out location and description when empty", () => {
    const ics = buildEventIcs(make({ location: "", description: "" }), NOW);
    expect(ics).not.toContain("LOCATION");
    expect(ics).not.toContain("DESCRIPTION");
  });
});

describe("googleCalendarUrl", () => {
  const parse = (e: CalendarEvent) =>
    new URL(googleCalendarUrl(e)).searchParams;

  it("points at Google's create-event page", () => {
    const url = new URL(googleCalendarUrl(make()));
    expect(url.origin + url.pathname).toBe(
      "https://calendar.google.com/calendar/render",
    );
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
  });

  it("carries title, dates, location and details", () => {
    const params = parse(make());
    expect(params.get("text")).toBe("Christmas market");
    expect(params.get("dates")).toBe("20261206T130000Z/20261206T160000Z");
    expect(params.get("location")).toContain("Town hall");
    expect(params.get("details")).toContain("Come and say hi.");
    expect(params.get("details")).toContain("/en/events/christmas-market");
  });

  it("repeats the start when there is no end", () => {
    expect(parse(make({ endDate: null })).get("dates")).toBe(
      "20261206T130000Z/20261206T130000Z",
    );
  });

  it("uses days for all-day events", () => {
    const params = parse(
      make({ allDay: true, startDate: "2026-12-06T10:00:00Z", endDate: null }),
    );
    expect(params.get("dates")).toBe("20261206/20261207");
  });

  it("leaves out the location when there is none", () => {
    expect(parse(make({ location: "" })).has("location")).toBe(false);
  });
});
