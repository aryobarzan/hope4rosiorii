import { describe, expect, it } from "vitest";
import { ageParts, monthsSince } from "./age";

// Dates are UTC midnight, matching how monthsSince reads them
const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("monthsSince", () => {
  it("returns null when there is no birth date", () => {
    expect(monthsSince(null, at("2026-10-21"))).toBeNull();
  });

  it("counts whole months, rounded down", () => {
    expect(monthsSince("2025-10-21", at("2026-10-21"))).toBe(12);
    expect(monthsSince("2025-10-21", at("2026-10-20"))).toBe(11);
    expect(monthsSince("2025-10-21", at("2026-11-20"))).toBe(12);
  });

  it("does not count a month before its day of the month is reached", () => {
    // 31 January to 28 February is not a full month yet
    expect(monthsSince("2026-01-31", at("2026-02-28"))).toBe(0);
  });

  it("is never negative for a birth date in the future", () => {
    expect(monthsSince("2027-01-01", at("2026-10-21"))).toBe(0);
  });
});

describe("ageParts", () => {
  it("shows months under a year, at least 1", () => {
    expect(ageParts(0)).toEqual({ unit: "months", count: 1 });
    expect(ageParts(1)).toEqual({ unit: "months", count: 1 });
    expect(ageParts(11)).toEqual({ unit: "months", count: 11 });
  });

  it("switches to years at 12 months and rounds to whole years", () => {
    expect(ageParts(12)).toEqual({ unit: "years", count: 1 });
    expect(ageParts(17)).toEqual({ unit: "years", count: 1 });
    expect(ageParts(18)).toEqual({ unit: "years", count: 2 });
    expect(ageParts(60)).toEqual({ unit: "years", count: 5 });
  });
});
