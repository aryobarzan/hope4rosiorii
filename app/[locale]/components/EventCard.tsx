import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Event } from "@/lib/events";
import SanityImage from "./SanityImage";
import { Calendar, ChevronRight, MapPin, PawPrint } from "lucide-react";
import { EventStatus, eventDayParts, formatEventDate } from "@/lib/event-time";

// `status` is decided by the list (it needs the current time, which a card
// should not read itself). Cancelled is a separate flag: a cancelled event can
// be upcoming or past, and the card looks the same either way.
export default function EventCard({
  event,
  locale,
  status,
}: {
  event: Event;
  locale: string;
  status: EventStatus;
}) {
  const t = useTranslations("EventsPage");
  const date = formatEventDate(event, locale);
  const { day, month } = eventDayParts(event.startDate, locale);
  const cancelled = event.cancelled === true;
  // A pill for "today" and "happening now" only: upcoming and past events need
  // none, and a cancelled event gets the cancelled pill instead.
  const statusPill =
    status === "today"
      ? t("card.today")
      : status === "ongoing"
        ? t("card.happeningNow")
        : null;

  return (
    <li>
      <Link
        href={{ pathname: `/events/${event.slug}` }}
        className="event-card"
        data-cancelled={cancelled}
        data-status={status}
      >
        {/* min-w-0 lets this row shrink below its content width; without it a
            long word pushes the card past the edge of a phone screen. */}
        <div className="flex min-w-0 flex-row gap-4">
          <div className="relative w-20 shrink-0 sm:w-28">
            <div className="event-card-photo relative picture-placeholder blob-frame grid aspect-square w-full place-items-center">
              {event.coverImage && event.coverImage.url ? (
                <SanityImage
                  src={event.coverImage.url}
                  alt={event.coverImage.alt ?? ""}
                  sizes="112px"
                  hotspot={event.coverImage.hotspot}
                />
              ) : (
                // No photo yet: a paw instead of an empty blob.
                <PawPrint aria-hidden="true" className="size-1/3 text-brand" />
              )}
            </div>
            {/* Calendar leaf. Sits on the photo's corner, outside the blob so
                its overflow does not clip it. Hidden from assistive tech: the
                full date is in the text. */}
            <div aria-hidden="true" className="event-card-leaf">
              <span className="font-heading text-xl leading-none">{day}</span>
              <span className="text-xs font-bold uppercase leading-none">
                {month}
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-1 wrap-anywhere">
            {cancelled ? (
              <p className="pill self-start text-link font-body text-lg">
                {t("card.cancelled")}
              </p>
            ) : (
              statusPill && (
                <p className="pill self-start bg-link text-white font-body text-lg">
                  {statusPill}
                </p>
              )
            )}
            <p className="event-card-title font-body text-2xl font-bold">
              {event.title}
            </p>
            <div className="flex flex-col gap-1">
              {event.location && event.location.name && (
                <span className="flex flex-row items-start gap-1.5">
                  <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0" />
                  <span className="line-clamp-2">{event.location.name}</span>
                </span>
              )}

              <span className="flex flex-row items-start gap-1.5">
                <Calendar aria-hidden="true" className="mt-1 size-4 shrink-0" />
                {/* <time> holds one moment, so only a single-date event gets
                    it. A formatted range ("6–8 Dec") has no valid dateTime. */}
                {event.endDate ? (
                  <span>{date}</span>
                ) : (
                  <time dateTime={event.startDate}>{date}</time>
                )}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
      </Link>
    </li>
  );
}
