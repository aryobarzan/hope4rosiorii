import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { locales, pages } from "./pages";

// An automated accessibility scan (axe-core) of every page in every language,
// against WCAG 2.1 A and AA. It finds roughly a third of accessibility
// problems: contrast, missing labels and names, wrong ARIA, bad headings. It
// cannot judge whether alt text is meaningful or whether the page makes sense
// with a screen reader, so it complements a manual check and does not replace
// one.

for (const locale of locales) {
  for (const [name, path] of pages) {
    test(`${name} page in ${locale} has no accessibility violations`, async ({
      page,
    }) => {
      await page.goto(`/${locale}${path}`);
      // Streamed parts (such as the contact form) must be in place first
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // A readable failure: which rule, how bad, and which elements (for a
      // contrast problem, also the colours and their ratio)
      const report = results.violations.map((violation) => ({
        rule: violation.id,
        impact: violation.impact,
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
}
