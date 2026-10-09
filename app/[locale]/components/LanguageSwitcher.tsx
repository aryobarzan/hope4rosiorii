"use client";

import { hasLocale, useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Native names are shown in the open list, short codes while it is closed
const languages: Record<(typeof routing.locales)[number], string> = {
  lb: "Lëtzebuergesch",
  en: "English",
  fr: "Français",
  de: "Deutsch",
};

export default function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (hasLocale(routing.locales, next)) {
      router.replace(pathname, { locale: next });
    }
  }

  // A real <select> sits invisibly on top of a styled label. The browser still
  // handles keyboard, screen readers and the native option list, but what we
  // see when it is closed is the short code (a native <select> can only show
  // the selected option's full text).
  return (
    <div className="relative inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-pale bg-card px-4 font-bold text-ink transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink hover:border-button">
      <span aria-hidden="true" className="uppercase">
        {locale}
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="size-4 fill-none stroke-current stroke-2"
      >
        <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <select
        aria-label={t("language")}
        value={locale}
        onChange={onChange}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      >
        {routing.locales.map((code) => (
          <option
            key={code}
            value={code}
            lang={code}
            className="bg-card text-ink"
          >
            {languages[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
