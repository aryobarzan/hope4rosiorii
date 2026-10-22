import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { pages } from "./pages";

// The same axe scan as a11y.spec.ts, on a phone-sized screen. Small screens
// show different things (the menu button, the filter dropdowns), and so can
// have their own problems. Two languages are enough here: the layout does not
// depend on the language, and the full matrix runs on desktop.
const addresses = [
  ...(["lb", "en"] as const).flatMap((locale) =>
    pages.map(([name, path]) => [`${name} (${locale})`, `/${locale}${path}`] as const),
  ),
  // The filter dropdowns with a choice made look different (filled)
  ["animals with filters chosen", "/en/animals?size=small&age=baby"] as const,
];

for (const [name, address] of addresses) {
  test(`${name} has no accessibility violations on a phone`, async ({ page }) => {
    await page.goto(address);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const report = results.violations.map((violation) => ({
      rule: violation.id,
      help: violation.help,
      elements: violation.nodes.map((node) => {
        const data = node.any[0]?.data;
        return {
          target: node.target.join(" "),
          colours:
            violation.id === "color-contrast"
              ? `${data?.fgColor} on ${data?.bgColor} = ${data?.contrastRatio}`
              : undefined,
        };
      }),
    }));
    expect(report).toEqual([]);
  });
}

// The mobile menu is closed in the scans above; its links and button have to
// pass as well once it is open.
test("the open mobile menu has no accessibility violations", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations.map((violation) => violation.id)).toEqual([]);
});
