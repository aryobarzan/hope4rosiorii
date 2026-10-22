// Makes next-intl type-aware of messages. After this, t("some.key") only
// compiles when the key exists: a missing key or a typo becomes a type error
// (in the editor, `tsc` and CI) instead of a raw key on the page. Only keys
// are checked, not the {arguments} a message declares.
//
// lb.json is the reference: it is the default locale, and
// messages/messages.test.ts checks that en, fr and de have exactly the same
// keys. messages/typed-messages.check.ts fails `tsc` if this typing stops
// working.
import type { routing } from "@/i18n/routing";
import type messages from "./messages/lb.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
