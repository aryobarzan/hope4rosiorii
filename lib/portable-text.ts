// Helpers for Sanity Portable Text, shared by events and news posts.
import { toPlainText } from "@portabletext/react";

type PortableTextValue = Parameters<typeof toPlainText>[0];

// A short plain-text summary for meta descriptions. Cut at `max` characters
// with an ellipsis; undefined when there is no text, so the tag is left out.
export function excerpt(body: PortableTextValue | null, max = 160) {
  if (!body) return undefined;
  const text = toPlainText(body).replace(/\s+/g, " ").trim();
  if (text.length === 0) return undefined;
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}
