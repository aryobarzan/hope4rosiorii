import { hasLocale } from "next-intl";
import { io } from "next/cache";
import { routing } from "@/i18n/routing";
import { getEvent } from "@/lib/events";
import { buildEventIcs, toCalendarEvent } from "@/lib/event-calendar";

const notFound = () => new Response("Not found", { status: 404 });

// /{locale}/events/{slug}/calendar.ics. proxy.ts skips addresses with a file
// extension, so no locale redirect or slug lookup runs first: this handler
// answers its own 404. The locale comes from the address and is validated,
// because next/root-params does not work in Route Handlers.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; event: string }> },
) {
  const { locale, event: slug } = await params;
  if (!hasLocale(routing.locales, locale)) return notFound();

  const event = await getEvent(slug, locale);
  if (!event) return notFound();

  // next-intl's getTranslations reads next/root-params through i18n/request.ts,
  // which does not work in Route Handlers yet. The one message needed is read
  // from the locale's file directly (the locale was validated above).
  const messages = (await import(`@/messages/${locale}.json`)).default;
  // DTSTAMP is "now", so this must be rendered per request, not at build time
  await io();
  const ics = buildEventIcs(
    toCalendarEvent(event, {
      slug,
      locale,
      title: event.title ?? messages.EventPage.untitled,
    }),
    new Date(),
  );

  // The slug is from the address: keep the file name to safe characters
  const fileName = slug.replace(/[^a-zA-Z0-9_-]/g, "-");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}.ics"`,
      "Cache-Control": "public, s-maxage=300",
    },
  });
}
