import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getEvent } from "@/lib/events";

vi.mock("@/lib/events", () => ({ getEvent: vi.fn() }));
vi.mock("next/cache", () => ({ io: vi.fn() }));

const event = {
  _id: "1",
  slug: "market",
  title: "Market",
  startDate: "2026-12-06T13:00:00Z",
  endDate: null,
  allDay: false,
  cancelled: false,
  location: null,
  externalUrl: null,
  body: null,
  coverImage: null,
};

const call = (locale: string, slug: string) =>
  GET(new Request("http://localhost/x"), {
    params: Promise.resolve({ locale, event: slug }),
  });

describe("/[locale]/events/[event]/calendar.ics", () => {
  beforeEach(() => {
    vi.mocked(getEvent).mockResolvedValue(event as never);
  });

  it("answers 404 for an unknown event", async () => {
    vi.mocked(getEvent).mockResolvedValue(undefined);
    expect((await call("en", "nope")).status).toBe(404);
  });

  it("answers 404 for a locale that does not exist, without a lookup", async () => {
    vi.mocked(getEvent).mockClear();
    expect((await call("xx", "market")).status).toBe(404);
    expect(getEvent).not.toHaveBeenCalled();
  });

  it("returns the calendar file for a known event", async () => {
    const response = await call("en", "market");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/calendar; charset=utf-8",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="market.ics"',
    );
    expect(await response.text()).toContain("SUMMARY:Market");
  });

  it("keeps the download file name to safe characters", async () => {
    const response = await call("en", 'a"b/c');
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="a-b-c.ics"',
    );
  });
});
