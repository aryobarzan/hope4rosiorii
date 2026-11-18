import { io } from "next/cache";
import { getTranslations } from "next-intl/server";
import { eventStatus } from "@/lib/event-time";

// The only part of the event page that depends on the current time. It lives
// in its own component, wrapped in <Suspense> by the page, so that
// `await io()` (render at request time) does not drag the whole page out of
// the static shell. See EventList.tsx for what io() does.
export default async function EventStatusPill({
  startDate,
  endDate,
  cancelled,
}: {
  startDate: string;
  endDate: string | null;
  cancelled: boolean;
}) {
  const t = await getTranslations("EventsPage.card");
  if (cancelled) {
    return (
      <p className="pill self-start text-link text-lg">{t("cancelled")}</p>
    );
  }
  await io();
  const status = eventStatus({ startDate, endDate }, new Date());
  const label =
    status === "today"
      ? t("today")
      : status === "ongoing"
        ? t("happeningNow")
        : null;
  if (!label) return null;
  return <p className="pill self-start bg-link text-lg text-white">{label}</p>;
}
