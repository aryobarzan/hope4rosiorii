"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

// Error boundary for every page under /[locale]. It sits inside the layout, so
// the header and footer stay visible. Errors in the layout itself are not
// caught here (that is done by app/global-error.tsx).
export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    // Production hides the real message from the client; `digest` matches the
    // server-side log entry.
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="page-container page-section flex flex-col items-center gap-2 text-center"
    >
      <h1 className="font-heading text-3xl">{t("title")}</h1>
      <p>{t("description")}</p>
      <button
        type="button"
        onClick={() => retry()}
        className="filled-button font-bold"
      >
        {t("retry")}
      </button>
    </div>
  );
}
