"use client";

import { useEffect, useSyncExternalStore } from "react";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import "./globals.css";

// Last-resort error page, used only when the locale layout itself throws (for
// example the header or footer). It replaces the whole document, so
// NextIntlClientProvider and the message files are not available here.
//
// Next finds this file by name and sits in the
// root app/ folder and default-exports a Client Component. error.tsx (in
// app/[locale]/) handles every other error and keeps the header and footer;
// this one is the fallback for when the layout itself breaks, so it has to
// render its own <html> and <body>.
const copy = {
  lb: {
    title: "Et ass eppes schifgaangen",
    description:
      "Entschëllegt, dës Säit konnt net gelueden ginn. Probéiert w.e.g. nach eng Kéier.",
    retry: "Nach eng Kéier probéieren",
  },
  en: {
    title: "Something went wrong",
    description: "Sorry, this page could not be loaded. Please try again.",
    retry: "Try again",
  },
  fr: {
    title: "Une erreur s'est produite",
    description:
      "Désolé, cette page n'a pas pu être chargée. Veuillez réessayer.",
    retry: "Réessayer",
  },
  de: {
    title: "Etwas ist schiefgelaufen",
    description:
      "Entschuldigung, diese Seite konnte nicht geladen werden. Bitte versuchen Sie es erneut.",
    retry: "Erneut versuchen",
  },
} satisfies Record<(typeof routing.locales)[number], object>;

// The locale is the first URL segment (/fr/animals). Read from the URL because
// no provider exists here. useSyncExternalStore renders the default locale on
// the server and during hydration, then switches, so there is no mismatch.
function getLocale() {
  const first = window.location.pathname.split("/")[1];
  return hasLocale(routing.locales, first) ? first : routing.defaultLocale;
}

const subscribe = () => () => {};

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const locale = useSyncExternalStore(
    subscribe,
    getLocale,
    () => routing.defaultLocale,
  );
  const t = copy[locale];

  // Logging is a side effect, so it goes in an effect: it runs once in the
  // browser per error, not on every (re-)render or on the server.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body className="flex min-h-full flex-col">
        <main
          role="alert"
          className="page-container page-section flex flex-col items-center gap-2 text-center"
        >
          <h1 className="font-heading text-3xl">{t.title}</h1>
          <p>{t.description}</p>
          <button
            type="button"
            onClick={() => retry()}
            className="filled-button font-bold"
          >
            {t.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
