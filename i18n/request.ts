import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import * as rootParams from "next/root-params";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  // `[locale]` is the root layout's param, so Next exposes it here without
  // needing `setRequestLocale` in every layout and page
  const requested = await rootParams.locale();
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
