import { expect, test } from "@playwright/test";
import en from "../messages/en.json";

// Runs in the "mobile" project (a phone-sized screen). Below the sm
// breakpoint each filter group is a dropdown, not a row of links.
const filter = en.DogsPage.filter;

test("filters are dropdowns on a small screen, not rows of links", async ({
  page,
}) => {
  await page.goto("/en/animals");

  await expect(
    page.getByRole("combobox", { name: filter.sizeLabel, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: filter.ageLabel, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: filter.sizeLabel, exact: true }),
  ).toBeHidden();
});

test("choosing an option in a dropdown updates the address", async ({ page }) => {
  await page.goto("/en/animals");
  const size = page.getByRole("combobox", { name: filter.sizeLabel, exact: true });

  await size.selectOption({ label: filter.size.small });

  await expect(page).toHaveURL(/\/en\/animals\?size=small$/);
  await expect(size).toHaveValue("small");

  await size.selectOption({ label: filter.all });
  await expect(page).toHaveURL(/\/en\/animals$/);
});

test("a shared address opens with its dropdowns set", async ({ page }) => {
  await page.goto("/en/animals?size=large&age=baby");

  await expect(
    page.getByRole("combobox", { name: filter.sizeLabel, exact: true }),
  ).toHaveValue("large");
  await expect(
    page.getByRole("combobox", { name: filter.ageLabel, exact: true }),
  ).toHaveValue("baby");
});
