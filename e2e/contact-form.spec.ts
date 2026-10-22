import { expect, test } from "@playwright/test";
import en from "../messages/en.json";

// The form shows a field's error once the field has been left (RHF mode
// "onTouched"), and "Send" stays disabled until the whole form is valid. So
// these tests never press "Send": a valid submission would reach the Server
// Action and try to send an email (the test server runs with dummy mail
// settings, see playwright.config.ts, but there is nothing worth sending
// here). The action itself is covered by unit tests.
const form = en.ContactPage;

test.describe("contact form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/contact");
    // The page first shows a fallback form, then streams in the real one (it
    // has to read the ?dog= address parameter) and swaps it in. Until then
    // both exist, and anything typed into the fallback is lost in the swap.
    // Their ids are the same, so "exactly one" means the swap has happened.
    await expect(page.locator("#website")).toHaveCount(1);
  });

  test("cannot be sent while empty", async ({ page }) => {
    await expect(page.getByRole("button", { name: form.submit })).toBeDisabled();
  });

  test("says a field is required once it is left empty", async ({ page }) => {
    const name = page.getByLabel(form.name);

    await name.click();
    await page.keyboard.press("Tab");

    await expect(page.getByText(form.errors.required)).toBeVisible();
    // Marked invalid for assistive technology too, not just coloured
    await expect(name).toHaveAttribute("aria-invalid", "true");
  });

  test("flags an email address that is not one", async ({ page }) => {
    const email = page.getByLabel(form.email);

    await email.fill("not-an-email");
    await page.keyboard.press("Tab");

    await expect(page.getByText(form.errors.invalidEmail)).toBeVisible();
    await expect(email).toHaveAttribute("aria-invalid", "true");
  });

  test("asks for the privacy consent", async ({ page }) => {
    const consent = page.getByRole("checkbox");

    await consent.check();
    await consent.uncheck();
    await page.keyboard.press("Tab");

    await expect(page.getByText(form.errors.consentRequired)).toBeVisible();
  });

  test("can be sent once everything is filled in", async ({ page }) => {
    const send = page.getByRole("button", { name: form.submit });
    await expect(send).toBeDisabled();

    await page.getByLabel(form.name).fill("Anna Muller");
    await page.getByLabel(form.email).fill("anna@example.com");
    await page
      .getByLabel(form.reason)
      .selectOption({ label: form.reasons.general });
    await page.getByLabel(form.message).fill("Hello!");
    await expect(send).toBeDisabled(); // still missing the consent

    await page.getByRole("checkbox").check();
    await expect(send).toBeEnabled();
    // ...and we stop here on purpose: see the note at the top
  });

  test("keeps the hidden spam-trap field out of reach for people", async ({
    page,
  }) => {
    // The honeypot is hidden from assistive technology and skipped by Tab.
    // If a person could reach it, they might fill it in and be ignored.
    await expect(page.locator("#website")).toHaveAttribute("tabindex", "-1");
    await expect(page.getByRole("textbox", { name: "Website" })).toHaveCount(0);
  });
});
