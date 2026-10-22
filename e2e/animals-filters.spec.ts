import { expect, test } from "@playwright/test";
import en from "../messages/en.json";

// The animals come from the team's CMS, so these tests do not rely on any
// particular animal. They check the wiring: what a click does to the address,
// what is marked as selected, and that the list and its messages agree. Which
// animals match which filter is covered by the unit tests.
const filter = en.DogsPage.filter;

test.describe("animal filters (large screens: rows of links)", () => {
  const sizeRow = (page: import("@playwright/test").Page) =>
    page.getByRole("navigation", { name: filter.sizeLabel, exact: true });
  const ageRow = (page: import("@playwright/test").Page) =>
    page.getByRole("navigation", { name: filter.ageLabel, exact: true });
  const cards = (page: import("@playwright/test").Page) =>
    page.locator(".dog-grid > li");

  test("clicking a size puts it in the address and marks it as selected", async ({
    page,
  }) => {
    await page.goto("/en/animals");
    const small = sizeRow(page).getByRole("link", { name: filter.size.small, exact: true });

    await small.click();

    await expect(page).toHaveURL(/\/en\/animals\?size=small$/);
    await expect(small).toHaveAttribute("aria-current", "true");
    await expect(
      sizeRow(page).getByRole("link", { name: filter.all, exact: true }),
    ).not.toHaveAttribute("aria-current", "true");
  });

  test("size and age combine, and 'All' takes one back off", async ({ page }) => {
    await page.goto("/en/animals");

    // Wait for each navigation to finish before the next click: each link's
    // address is built from the filters that are active when it is rendered
    await sizeRow(page).getByRole("link", { name: filter.size.medium, exact: true }).click();
    await expect(page).toHaveURL(/\/en\/animals\?size=medium$/);
    await ageRow(page).getByRole("link", { name: filter.age.adult, exact: true }).click();
    await expect(page).toHaveURL(/\/en\/animals\?size=medium&age=adult$/);

    await sizeRow(page).getByRole("link", { name: filter.all, exact: true }).click();
    await expect(page).toHaveURL(/\/en\/animals\?age=adult$/);

    await ageRow(page).getByRole("link", { name: filter.all, exact: true }).click();
    await expect(page).toHaveURL(/\/en\/animals$/);
  });

  test("a shared address opens with its filters already applied", async ({
    page,
  }) => {
    await page.goto("/en/animals?size=large&age=young");

    await expect(
      sizeRow(page).getByRole("link", { name: filter.size.large, exact: true }),
    ).toHaveAttribute("aria-current", "true");
    await expect(
      ageRow(page).getByRole("link", { name: filter.age.young, exact: true }),
    ).toHaveAttribute("aria-current", "true");
  });

  test("an unknown filter value in the address is ignored", async ({ page }) => {
    await page.goto("/en/animals?size=huge&age=ancient");

    await expect(
      sizeRow(page).getByRole("link", { name: filter.all, exact: true }),
    ).toHaveAttribute("aria-current", "true");
    await expect(
      ageRow(page).getByRole("link", { name: filter.all, exact: true }),
    ).toHaveAttribute("aria-current", "true");
  });

  test("filtering never adds animals, and an empty result says so", async ({
    page,
  }) => {
    await page.goto("/en/animals");
    await expect(cards(page).first()).toBeVisible();
    const all = await cards(page).count();

    for (const size of ["small", "medium", "large"] as const) {
      await page.goto(`/en/animals?size=${size}`);
      await expect(
        sizeRow(page).getByRole("link", { name: filter.size[size], exact: true }),
      ).toHaveAttribute("aria-current", "true");

      const shown = await cards(page).count();
      expect(shown).toBeLessThanOrEqual(all);
      // The message shows exactly when there is nothing to show
      await expect(page.getByText(en.DogsPage.noMatch)).toHaveCount(
        shown === 0 ? 1 : 0,
      );
    }
  });
});
