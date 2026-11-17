import { useTranslations } from "next-intl";

// Fallback for the <Suspense> around EventList. It mirrors the real list: a
// heading bar, then cards with a round photo and three text lines, so little
// moves when the events stream in. The pulse sits on the wrapper (one
// animation, not one per bar) and is switched off for people who prefer less
// motion. `role="status"` plus the sr-only text tells screen readers what is
// loading; the shapes themselves are decoration.
const CARDS = 3;

export default function EventListSkeleton() {
  const t = useTranslations("EventsPage");
  return (
    <div
      role="status"
      className="flex animate-pulse flex-col gap-4 motion-reduce:animate-none"
    >
      <span className="sr-only">{t("loading")}</span>
      <div aria-hidden="true" className="h-9 w-56 rounded-full bg-pale" />
      <div aria-hidden="true" className="event-list">
        {Array.from({ length: CARDS }, (_, i) => (
          <div
            key={i}
            className="flex flex-row items-center gap-4 rounded-4xl bg-white p-(--card-padding)"
          >
            <div className="picture-placeholder blob-frame aspect-square w-20 shrink-0 sm:w-28" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="h-6 w-2/3 rounded-full bg-pale" />
              <div className="h-4 w-1/2 rounded-full bg-pale" />
              <div className="h-4 w-2/5 rounded-full bg-pale" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
