import { expect, test, type Page } from "@playwright/test";
import en from "../messages/en.json";

// Runs in the "mobile" project (a phone-sized screen). Below the lg breakpoint
// the size and age filters live in a sheet opened by one "Filters" button; the
// species links stay on the page.
const filter = en.DogsPage.filter;

const openButton = (page: Page) =>
  page.getByRole("button", { name: /^Filters/ });
const sheet = (page: Page) =>
  page.getByRole("dialog", { name: filter.title, exact: true });

test("the filters are behind one button, and the sidebar is hidden", async ({
  page,
}) => {
  await page.goto("/en/animals");

  await expect(openButton(page)).toBeVisible();
  await expect(sheet(page)).toBeHidden();
  await expect(page.getByRole("complementary", { name: filter.title })).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: filter.sizeLabel, exact: true }),
  ).toBeHidden();
});

test("choosing an option in the sheet updates the address and the button", async ({
  page,
}) => {
  await page.goto("/en/animals");
  await openButton(page).click();
  await expect(sheet(page)).toBeVisible();

  await sheet(page)
    .getByRole("navigation", { name: filter.sizeLabel, exact: true })
    .getByRole("link", { name: filter.size.small, exact: true })
    .click();

  await expect(page).toHaveURL(/\/en\/animals\?size=small$/);
  // The sheet stays open, so more than one filter can be set in a row
  await expect(sheet(page)).toBeVisible();

  await sheet(page).getByRole("button", { name: /^Show/ }).click();
  await expect(sheet(page)).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Filters (1)", exact: true }),
  ).toBeVisible();
});

test("an active filter shows as a chip that removes it", async ({ page }) => {
  await page.goto("/en/animals?size=large");
  const chips = page.getByRole("list", { name: filter.active, exact: true });

  await expect(chips).toBeVisible();
  await chips
    .getByRole("link", { name: `Remove filter: ${filter.sizeLabel}: ${filter.size.large}` })
    .click();

  await expect(page).toHaveURL(/\/en\/animals$/);
  await expect(chips).toHaveCount(0);
});

test("Escape closes the sheet", async ({ page }) => {
  await page.goto("/en/animals");
  await openButton(page).click();
  await expect(sheet(page)).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(sheet(page)).toBeHidden();
});

test("a shared address opens with its filters marked in the sheet", async ({
  page,
}) => {
  await page.goto("/en/animals?size=large&age=puppy");
  await openButton(page).click();

  await expect(
    sheet(page)
      .getByRole("navigation", { name: filter.sizeLabel, exact: true })
      .getByRole("link", { name: filter.size.large, exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await expect(
    sheet(page)
      .getByRole("navigation", { name: filter.ageLabel, exact: true })
      .getByRole("link", { name: en.Age.stage.puppy, exact: true }),
  ).toHaveAttribute("aria-current", "true");
});
