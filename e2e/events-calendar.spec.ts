import { expect, test, type Page } from "@playwright/test";

// Opens the first event that has an "Add to calendar" button (a cancelled event
// has none), so the tests do not depend on one particular slug. With no such
// event in the dataset there is nothing to test.
async function openEventWithCalendar(page: Page) {
  await page.goto("/en/events");
  const hrefs = await page
    .locator('a[href*="/en/events/"]')
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")!));
  const button = page.getByRole("button", {
    name: "Add to calendar",
    exact: true,
  });
  for (const href of new Set(hrefs)) {
    await page.goto(href);
    if ((await button.count()) > 0) return button;
  }
  test.skip(true, "no event with a calendar button in the dataset");
  return button;
}

test("the add-to-calendar dropdown opens, lists both options and closes on Escape", async ({
  page,
}) => {
  const button = await openEventWithCalendar(page);

  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");

  const google = page.getByRole("link", { name: /^Google Calendar/ });
  const other = page.getByRole("link", { name: /^Other \(Apple/ });
  await expect(google).toHaveAttribute(
    "href",
    /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/,
  );
  await expect(google).toHaveAttribute("target", "_blank");
  await expect(other).toHaveAttribute("href", /\/calendar\.ics$/);

  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});

test("the .ics link serves a calendar file", async ({ page, request }) => {
  const button = await openEventWithCalendar(page);
  await button.click();

  const href = await page
    .getByRole("link", { name: /^Other \(Apple/ })
    .getAttribute("href");
  const response = await request.get(href!);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/calendar");
  expect(await response.text()).toContain("BEGIN:VEVENT");
});

test("an unknown event has no calendar file", async ({ request }) => {
  const response = await request.get("/en/events/no-such-event/calendar.ics");
  expect(response.status()).toBe(404);
});
