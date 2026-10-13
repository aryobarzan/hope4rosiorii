// Turns an age in months into the unit and count the `Age` messages expect.
// Under a year shows months (at least 1), otherwise whole years, rounded.
export function ageParts(months: number): {
  unit: "months" | "years";
  count: number;
} {
  if (months < 12) return { unit: "months", count: Math.max(1, months) };
  return { unit: "years", count: Math.round(months / 12) };
}
