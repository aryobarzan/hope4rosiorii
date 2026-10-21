import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// "server-only" throws when imported outside the Next.js server bundle
vi.mock("server-only", () => ({}));

import { isRateLimited } from "./rate-limit";

// The counters live in module memory and are shared by all tests, so every
// test uses its own key.
let key = 0;
const newKey = () => `test-${key++}`;

describe("isRateLimited", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit, then blocks", () => {
    const k = newKey();
    for (let i = 0; i < 5; i++) expect(isRateLimited(k)).toBe(false);
    expect(isRateLimited(k)).toBe(true);
    expect(isRateLimited(k)).toBe(true);
  });

  it("uses a custom limit", () => {
    const k = newKey();
    expect(isRateLimited(k, 2)).toBe(false);
    expect(isRateLimited(k, 2)).toBe(false);
    expect(isRateLimited(k, 2)).toBe(true);
  });

  it("counts each key separately", () => {
    const a = newKey();
    const b = newKey();
    expect(isRateLimited(a, 1)).toBe(false);
    expect(isRateLimited(a, 1)).toBe(true);
    expect(isRateLimited(b, 1)).toBe(false);
  });

  it("frees up again once the window has passed", () => {
    const k = newKey();
    const windowMs = 60_000;
    expect(isRateLimited(k, 1, windowMs)).toBe(false);
    expect(isRateLimited(k, 1, windowMs)).toBe(true);

    vi.advanceTimersByTime(windowMs - 1);
    expect(isRateLimited(k, 1, windowMs)).toBe(true);

    vi.advanceTimersByTime(1);
    expect(isRateLimited(k, 1, windowMs)).toBe(false);
  });

  it("does not count blocked attempts against the window", () => {
    const k = newKey();
    const windowMs = 60_000;
    expect(isRateLimited(k, 1, windowMs)).toBe(false);
    vi.advanceTimersByTime(30_000);
    expect(isRateLimited(k, 1, windowMs)).toBe(true); // blocked, not recorded
    vi.advanceTimersByTime(30_000);
    // The first hit is now 60 s old, so one call fits again
    expect(isRateLimited(k, 1, windowMs)).toBe(false);
  });
});
