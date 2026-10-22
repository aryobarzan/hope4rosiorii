import { expect, test } from "@playwright/test";
import { locales } from "./pages";

test.describe("sitemap.xml", () => {
  test("lists every page in every language, each linking its translations", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const xml = await response.text();

    expect(response.status()).toBe(200);
    for (const locale of locales) {
      expect(xml).toContain(`/${locale}/animals</loc>`);
      expect(xml).toContain(`hreflang="${locale}"`);
    }
    expect(xml).toContain('hreflang="x-default"');
  });

  test("includes the animals' pages", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toMatch(/\/lb\/animals\/[a-z0-9-]+<\/loc>/);
  });
});

test.describe("robots.txt", () => {
  // Only the production deployment may be indexed (VERCEL_ENV is "production"
  // there). Anywhere else, like this test server, everything is disallowed.
  test("disallows everything outside production", async ({ request }) => {
    const response = await request.get("/robots.txt");
    const text = await response.text();

    expect(response.status()).toBe(200);
    expect(text).toMatch(/Disallow: \/\s*$/m);
    expect(text).not.toContain("Sitemap:");
  });
});
