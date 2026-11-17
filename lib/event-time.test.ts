import { describe, expect, it } from "vitest";
import { getNextEvent, splitEvents } from "@/lib/event-time";

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

describe("getNextEvent", () => {
  it("skips cancelled events", () => {
    const cancelled = make({ slug: "c", cancelled: true, startDate: "2027-01-01T10:00:00Z" });
    const ok = make({ slug: "ok", startDate: "2027-02-01T10:00:00Z" });
    expect(getNextEvent([cancelled, ok], new Date("2026-11-17T00:00:00Z"))?.slug).toBe("ok");
  });
});
