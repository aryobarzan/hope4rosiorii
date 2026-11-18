"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Share } from "lucide-react";

// Opens the phone's share sheet where the browser has one (navigator.share),
// and otherwise copies the page link. The address is read at click time, so
// the component needs no props about the URL and renders the same on the
// server and in the browser.
export default function ShareButton({ title }: { title: string }) {
  const t = useTranslations("EventPage");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Closing the share sheet rejects with AbortError: not a failure.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        // Any other failure falls through to copying the link.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard access can be denied; the address bar still has the link.
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  const Icon = copied ? Check : Share;
  return (
    <>
      <button type="button" onClick={share} className="filled-button font-bold">
        <Icon aria-hidden="true" className="size-5" />
        {t("share")}
      </button>
      {/* Live region so screen reader users hear the confirmation. It must
          exist before its text changes, so it is always rendered. */}
      <span role="status" className="sr-only">
        {copied ? t("linkCopied") : ""}
      </span>
    </>
  );
}
