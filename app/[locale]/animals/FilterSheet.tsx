"use client";

import { useId, useRef } from "react";
import { useTranslations } from "next-intl";

// The filters below the lg breakpoint: one "Filters" button that opens a bottom
// sheet. It is a native <dialog> opened with showModal(), so the browser gives
// us the focus trap, Escape to close, an inert page behind it and focus
// returning to the button, with no library. The filter links inside change the
// URL as usual, so the sheet stays open and the list behind it updates live.
export default function FilterSheet({
  activeCount,
  resultCount,
  children,
}: {
  activeCount: number;
  resultCount: number;
  children: React.ReactNode;
}) {
  const t = useTranslations("DogsPage.filter");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={`${activeCount > 0 ? "filled-button" : "outlined-button"} min-h-11 font-bold lg:hidden`}
      >
        {activeCount > 0 ? t("openCount", { count: activeCount }) : t("open")}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        // The dialog itself has no padding, so a click whose target is the
        // dialog element is a click on the backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        className="m-0 mt-auto max-h-none w-full max-w-none rounded-t-4xl bg-card p-0 text-ink backdrop:bg-ink/50 lg:hidden"
      >
        <div className="flex max-h-[85dvh] flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="font-heading text-3xl">
              {t("title")}
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={t("close")}
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink hover:bg-pale active:bg-[color-mix(in_srgb,var(--color-pale),var(--color-ink)_12%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="size-5 fill-none stroke-current stroke-2"
              >
                <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto">{children}</div>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="filled-button font-bold"
          >
            {t("show", { count: resultCount })}
          </button>
        </div>
      </dialog>
    </>
  );
}
