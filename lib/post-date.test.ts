import { describe, expect, it } from "vitest";
import { formatPostDate } from "./post-date";

describe("formatPostDate", () => {
  it("formats the date in the given language", () => {
    expect(formatPostDate("2026-03-10T12:00:00Z", "en")).toBe("March 10, 2026");
    expect(formatPostDate("2026-03-10T12:00:00Z", "de")).toBe("10. März 2026");
  });

  it("uses the Luxembourg day, not the UTC day", () => {
    // 23:30 UTC on 10 March is already 00:30 on 11 March in Luxembourg (CET).
    expect(formatPostDate("2026-03-10T23:30:00Z", "en")).toBe("March 11, 2026");
  });
});
