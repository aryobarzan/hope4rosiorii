import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "lb", "fr", "de"],
  defaultLocale: "en",
});
