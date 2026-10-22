// What the end-to-end tests visit. Paths are the same in every locale
// (see i18n/routing.ts: no localized pathnames).
export const locales = ["lb", "en", "fr", "de"] as const;

export const pages = [
  ["home", ""],
  ["animals", "/animals"],
  ["adopt", "/adopt"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["donate", "/donate"],
  ["privacy policy", "/privacy-policy"],
] as const;
