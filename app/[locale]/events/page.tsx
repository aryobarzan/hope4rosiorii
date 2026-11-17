import type { Metadata } from "next";
import { getEvents } from "@/lib/events";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import EventList from "./EventList";
import EventListSkeleton from "./EventListSkeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("EventsPage.metadata");
  return { title: t("title"), description: t("description") };
}

export default async function Events() {
  const locale = await getLocale();
  const t = await getTranslations("EventsPage");
  const events = await getEvents(locale);
  return (
    <div className="page-container page-section section-stack">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-5xl">{t("title")}</h1>
        <p>{t("intro")}</p>
      </div>
      <Suspense fallback={<EventListSkeleton />}>
        <EventList events={events} locale={locale} />
      </Suspense>
    </div>
  );
}
