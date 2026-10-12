"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

type Props = {
  value: string;
  /** Already translated name of what is copied, e.g. "IBAN" */
  field: string;
};

export default function CopyButton({ value, field }: Props) {
  const t = useTranslations("DonatePage.bank");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard access can be denied (or missing outside https). The value
      // is still select-all, so the donor can copy it by hand.
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={t("copy", { field })}
        title={t("copy", { field })}
        className="-my-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {copied ? (
          <Check aria-hidden="true" strokeWidth={2.5} className="size-5" />
        ) : (
          <Copy aria-hidden="true" strokeWidth={2.5} className="size-5" />
        )}
      </button>
      {/* Live region so screen reader users hear the confirmation. It must
          exist before its text changes, so it is always rendered. */}
      <span role="status" className="sr-only">
        {copied ? t("copied") : ""}
      </span>
    </>
  );
}
