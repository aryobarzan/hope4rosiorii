import { io } from "next/cache";
import { Calendar } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getEvents } from "@/lib/events";
import { eventStatus, getNextEvent } from "@/lib/event-time";
import EventCard from "./EventCard";
import SectionHeading from "./SectionHeading";

// The home page's "next event" section. It renders its own <section>, so when
// there is nothing upcoming the whole block (heading and button too) is left
// out instead of showing an empty promise.
export default async function NextEventSection() {
  // Which event is "next" depends on the current time, so this cannot be frozen
  // into the pre-built page. Same reasoning as EventList: io() stops
  // pre-rendering here, and the <Suspense> around this component in the home
  // page keeps the rest of the page static. The Sanity data itself stays cached.
  await io();
  const now = new Date();
  const locale = await getLocale();
  const t = await getTranslations("HomePage.events");
  // Cancelled events are skipped by getNextEvent.
  const event = getNextEvent(await getEvents(locale), now);

  if (!event) return null;

  return (
    <section className="page-container page-section tight-section section-stack">
      <SectionHeading heading={t("heading")} />
      <ul className="event-list">
        <EventCard
          event={event}
          locale={locale}
          status={eventStatus(event, now)}
        />
      </ul>
      <Link href="/events" className="outlined-button font-bold self-start">
        <Calendar aria-hidden="true" className="size-5" />
        {t("viewAll")}
      </Link>
    </section>
  );
}
