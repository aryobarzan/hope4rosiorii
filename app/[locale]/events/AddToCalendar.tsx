"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus, ChevronDown } from "lucide-react";

type Props = {
  /** Google Calendar "create event" address */
  googleUrl: string;
  /** Address of the .ics file (Apple Calendar, Outlook, ...) */
  icsUrl: string;
};

// A disclosure dropdown: the button shows or hides a list of links. (Not an
// ARIA "menu": those promise arrow-key navigation, which plain links do not
// need. Tab moves through the links, Escape closes.)
export default function AddToCalendar({ googleUrl, icsUrl }: Props) {
  const t = useTranslations("EventPage");
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const itemClass =
    "flex min-h-11 items-center rounded-xl px-4 text-ink hover:bg-pale active:bg-[color-mix(in_srgb,var(--color-pale),black_12%)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink";

  return (
    <div
      ref={container}
      className="relative"
      // Tabbing out of the dropdown closes it
      onBlur={(event) => {
        if (!container.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="filled-button font-bold"
      >
        <CalendarPlus aria-hidden="true" className="size-5" />
        {t("addToCalendar")}
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          id={listId}
          className="absolute left-0 top-full z-10 mt-2 flex w-max min-w-full flex-col rounded-2xl bg-white p-1 shadow-lg sm:left-auto sm:right-0"
        >
          <li>
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              {t("calendarGoogle")}
              <span className="sr-only"> {t("opensInNewTab")}</span>
            </a>
          </li>
          <li>
            <a href={icsUrl} className={itemClass} onClick={() => setOpen(false)}>
              {t("calendarOther")}
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}
