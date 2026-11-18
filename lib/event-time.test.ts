import { describe, expect, it } from "vitest";
import {
  eventDayParts,
  eventStatus,
  formatEventParts,
  getNextEvent,
  splitEvents,
} from "@/lib/event-time";

type TestEvent = {
  slug: string;
  startDate: string;
  endDate: string | null;
  cancelled: boolean;
};

const make = (over: Partial<TestEvent>): TestEvent => ({
  slug: "x",
  startDate: "2026-12-06T09:00:00Z",
  endDate: null,
  cancelled: false,
  ...over,
});

describe("splitEvents", () => {
  it("keeps an event without an end upcoming until midnight in Luxembourg", () => {
    // 10:00 Luxembourg (UTC+1 in winter) on 6 Dec.
    const e = make({ startDate: "2026-12-06T09:00:00Z" });
    // 22:30 Luxembourg the same day: still upcoming.
    expect(splitEvents([e], new Date("2026-12-06T21:30:00Z")).upcoming).toHaveLength(1);
    // 00:30 Luxembourg the next day: past.
    expect(splitEvents([e], new Date("2026-12-06T23:30:00Z")).past).toHaveLength(1);
  });

  it("uses endDate when present", () => {
    const e = make({ endDate: "2026-12-06T12:00:00Z" });
    expect(splitEvents([e], new Date("2026-12-06T12:01:00Z")).past).toHaveLength(1);
  });

  it("orders upcoming soonest first and past newest first", () => {
    const a = make({ slug: "a", startDate: "2027-01-10T10:00:00Z" });
    const b = make({ slug: "b", startDate: "2027-01-05T10:00:00Z" });
    const c = make({ slug: "c", startDate: "2026-01-01T10:00:00Z" });
    const d = make({ slug: "d", startDate: "2026-02-01T10:00:00Z" });
    const { upcoming, past } = splitEvents([a, b, c, d], new Date("2026-11-17T00:00:00Z"));
    expect(upcoming.map((e) => e.slug)).toEqual(["b", "a"]);
    expect(past.map((e) => e.slug)).toEqual(["d", "c"]);
  });
});

describe("eventStatus", () => {
  // 10:00 Luxembourg on 6 Dec 2026 (UTC+1).
  const start = "2026-12-06T09:00:00Z";

  it("is upcoming on an earlier day", () => {
    expect(eventStatus(make({ startDate: start }), new Date("2026-12-04T12:00:00Z"))).toBe("upcoming");
  });

  it("is today before an event without an end starts, and after", () => {
    const e = make({ startDate: start });
    expect(eventStatus(e, new Date("2026-12-06T07:00:00Z"))).toBe("today");
    // Still "today", not "ongoing": there is no end to say it is running.
    expect(eventStatus(e, new Date("2026-12-06T13:00:00Z"))).toBe("today");
  });

  it("is ongoing between start and end", () => {
    const e = make({ startDate: start, endDate: "2026-12-06T15:00:00Z" });
    expect(eventStatus(e, new Date("2026-12-06T07:00:00Z"))).toBe("today");
    expect(eventStatus(e, new Date("2026-12-06T12:00:00Z"))).toBe("ongoing");
  });

  it("is ongoing on the middle day of a multi-day event", () => {
    const e = make({ startDate: start, endDate: "2026-12-08T15:00:00Z" });
    expect(eventStatus(e, new Date("2026-12-07T12:00:00Z"))).toBe("ongoing");
  });

  it("is past after the end", () => {
    const e = make({ startDate: start, endDate: "2026-12-06T15:00:00Z" });
    expect(eventStatus(e, new Date("2026-12-06T15:01:00Z"))).toBe("past");
  });

  it("uses the Luxembourg day, not the UTC day", () => {
    // 23:30 UTC on 5 Dec is already 00:30 on 6 Dec in Luxembourg.
    expect(eventStatus(make({ startDate: start }), new Date("2026-12-05T23:30:00Z"))).toBe("today");
  });
});

describe("eventDayParts", () => {
  it("returns the Luxembourg day and a short month", () => {
    // 23:30 UTC on 5 Dec is 6 Dec in Luxembourg.
    expect(eventDayParts("2026-12-05T23:30:00Z", "en")).toEqual({ day: "06", month: "Dec" });
  });

  it("drops the trailing dot of French short months", () => {
    expect(eventDayParts("2026-12-06T09:00:00Z", "fr").month).toBe("déc");
  });
});

describe("getNextEvent", () => {
  it("skips cancelled events", () => {
    const cancelled = make({ slug: "c", cancelled: true, startDate: "2027-01-01T10:00:00Z" });
    const ok = make({ slug: "ok", startDate: "2027-02-01T10:00:00Z" });
    expect(getNextEvent([cancelled, ok], new Date("2026-11-17T00:00:00Z"))?.slug).toBe("ok");
  });
});

describe("formatEventParts", () => {
  it("has no end for an event without one", () => {
    const { start, end } = formatEventParts(
      { startDate: "2026-12-06T13:00:00Z" },
      "en",
    );
    expect(start).toContain("2026");
    expect(end).toBeNull();
  });

  it("shows only the time on the end of a same-day event", () => {
    const { end } = formatEventParts(
      { startDate: "2026-12-06T13:00:00Z", endDate: "2026-12-06T16:00:00Z" },
      "en",
    );
    // Newer ICU versions put a narrow no-break space before "PM"; \s matches it.
    expect(end).toMatch(/^05:00\sPM$/);
  });

  it("shows the full date when the event spans several days", () => {
    const { end } = formatEventParts(
      { startDate: "2026-12-06T13:00:00Z", endDate: "2026-12-07T16:00:00Z" },
      "en",
    );
    expect(end).toContain("Dec");
  });
});
