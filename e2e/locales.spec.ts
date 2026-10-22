import { expect, test } from "@playwright/test";
import lb from "../messages/lb.json";

// next-intl picks the language from the browser's Accept-Language header
test.describe("the bare address", () => {
  test.describe("with a supported browser language", () => {
    test.use({ locale: "fr-FR" });

    test("goes to that language", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/fr$/);
    });
  });

  test.describe("with an unsupported browser language", () => {
    test.use({ locale: "pt-BR" });

    test("goes to the default language", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/lb$/);
    });
  });
});

// proxy.ts: an unknown language code is replaced, not treated as a page
test("an unknown language code falls back to the default language", async ({
  page,
}) => {
  await page.goto("/gn/animals");
  await expect(page).toHaveURL(/\/lb\/animals$/);
});

test("the language switcher keeps you on the same page", async ({ page }) => {
  await page.goto("/lb/animals");

  await page.getByRole("combobox", { name: lb.Nav.language }).selectOption("fr");

  await expect(page).toHaveURL(/\/fr\/animals$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});
