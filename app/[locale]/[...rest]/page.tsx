import { notFound } from "next/navigation";

// Catches any unmatched URL under a locale (e.g. /en/adoptsss) and hands it to
// app/[locale]/not-found.tsx, so the 404 keeps the header, footer and translations
//
// Opt out of instant-navigation validation: this page never renders UI, it only
// throws notFound(), so the dev-only validator errors with "could not validate `instant`"
export const instant = false;

export default function CatchAll() {
  notFound();
}
