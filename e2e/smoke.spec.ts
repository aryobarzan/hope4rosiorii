import { expect, test } from "@playwright/test";
import en from "../messages/en.json";
import { locales, pages } from "./pages";

// Every page in every language opens, in the right language, with one main
// heading and nothing broken in the browser console.
for (const locale of locales) {
  for (const [name, path] of pages) {
    test(`${name} page opens in ${locale}`, async ({ page }) => {
      const problems: string[] = [];
      page.on("pageerror", (error) => problems.push(`error: ${error.message}`));
      page.on("console", (message) => {
        if (message.type() === "error") {
          problems.push(`console: ${message.text()}`);
        }
      });

      const response = await page.goto(`/${locale}${path}`);

      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      // Wait for hydration, so errors that only appear then are caught too
      await page.waitForLoadState("networkidle");
      expect(problems).toEqual([]);
    });
  }
}

test("an animal's page opens from the listing", async ({ page }) => {
  await page.goto("/en/animals");
  // Whatever animal the team has published first: the data is theirs to change
  const first = page.locator('main a[href*="/animals/"]').first();
  await expect(first).toBeVisible();
  const href = await first.getAttribute("href");

  const response = await page.goto(href!);

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("an unknown address shows the not-found page", async ({ page }) => {
  const response = await page.goto("/en/this-page-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

// An animal page the build never saw starts streaming at once, which fixes the
// status at 200 before the page can find out the animal is missing. proxy.ts
// asks first and answers a real 404, so the first visit has to be a 404 too.
// Each run uses a slug nobody has requested before, because "first visit" is
// exactly what this is about.
for (const locale of locales) {
  test(`an unknown animal is a 404 on the first and on every later visit (${locale})`, async ({
    page,
  }) => {
    const address = `/${locale}/animals/no-such-animal-${Date.now()}`;

    for (const visit of ["first", "second"]) {
      const response = await page.goto(address);
      expect(response?.status(), `${visit} visit`).toBe(404);
    }

    // The visitor stays on the address they typed (it is a rewrite)
    await expect(page).toHaveURL(new RegExp(`${address}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    // ...and it is kept out of search results
    await expect(
      page.locator('meta[name="robots"][content="noindex"]').first(),
    ).toBeAttached();
  });
}

test("an unknown animal address shows the not-found page", async ({ page }) => {
  await page.goto("/en/animals/no-such-animal");

  await expect(page.getByText(en.NotFound.description)).toBeVisible();
});
