// Fallback for the <Suspense> around NextEventSection on the home page. It
// mirrors the section (heading bar, one event card, button) so the content
// below moves as little as possible when the event streams in. Hidden from
// assistive tech: unlike the events page, the home page has plenty of other
// content, and an announcement for a section that may turn out to be empty
// would only be noise. The pulse sits on one wrapper and is switched off for
// people who prefer less motion.
export default function NextEventSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="page-container page-section tight-section section-stack animate-pulse motion-reduce:animate-none"
    >
      <div className="h-12 w-64 max-w-full rounded-full bg-pale" />
      <div className="flex flex-row items-center gap-4 rounded-4xl bg-white p-(--card-padding)">
        <div className="picture-placeholder blob-frame aspect-square w-20 shrink-0 sm:w-28" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="h-6 w-2/3 rounded-full bg-pale" />
          <div className="h-4 w-1/2 rounded-full bg-pale" />
          <div className="h-4 w-2/5 rounded-full bg-pale" />
        </div>
      </div>
      <div className="h-11 w-40 rounded-full bg-pale" />
    </div>
  );
}
