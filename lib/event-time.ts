// Pure time logic for events, kept apart from lib/events.ts so tests can
// import it without the Sanity client.
//
// "Upcoming" depends on the current time, so it is never decided inside a
// cached function (it would be frozen at cache time). Callers pass `now`
// while rendering.
export const EVENT_TIME_ZONE = "Europe/Luxembourg";

type EventTimes = {
  startDate: string;
  endDate?: string | null;
  cancelled?: boolean | null;
};

const dayInLuxembourg = new Intl.DateTimeFormat("sv-SE", {
  timeZone: EVENT_TIME_ZONE,
});

// The next midnight in Luxembourg after `iso`. Found by stepping in 15-minute
// increments until the local date changes, which stays correct across the
// daylight-saving switch without any date library.
function nextLuxembourgMidnight(iso: string): number {
  const start = new Date(iso).getTime();
  const day = dayInLuxembourg.format(start);
  const step = 15 * 60 * 1000;
  let t = start;
  while (dayInLuxembourg.format(t) === day) t += step;
  return t;
}

// When an event stops counting as upcoming: its end, or when it has no end,
// midnight after its start day. So an event starting at 14:00 is still
// "upcoming" that evening, and an all-day event stays until midnight.
export function eventEnd(event: EventTimes): number {
  if (event.endDate) return new Date(event.endDate).getTime();
  return nextLuxembourgMidnight(event.startDate);
}

// Upcoming: soonest first. Past: most recent first (for the archive).
export function splitEvents<T extends EventTimes>(events: T[], now: Date) {
  const t = now.getTime();
  const upcoming = events
    .filter((e) => eventEnd(e) > t)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = events
    .filter((e) => eventEnd(e) <= t)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  return { upcoming, past };
}

// The next event for the home page. Cancelled events are skipped there.
export function getNextEvent<T extends EventTimes>(
  events: T[],
  now: Date,
): T | undefined {
  return splitEvents(events, now).upcoming.find((e) => !e.cancelled);
}
