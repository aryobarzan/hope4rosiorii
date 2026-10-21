// Months between the estimated birth date and now, rounded down, never negative.
export function monthsSince(date: string | null, now: Date): number | null {
  if (!date) return null;
  const born = new Date(date);
  const months =
    (now.getUTCFullYear() - born.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - born.getUTCMonth()) -
    (now.getUTCDate() < born.getUTCDate() ? 1 : 0);
  return Math.max(0, months);
}

// Turns an age in months into the unit and count the `Age` messages expect.
// Under a year shows months (at least 1), otherwise whole years, rounded.
export function ageParts(months: number): {
  unit: "months" | "years";
  count: number;
} {
  if (months < 12) return { unit: "months", count: Math.max(1, months) };
  return { unit: "years", count: Math.round(months / 12) };
}
