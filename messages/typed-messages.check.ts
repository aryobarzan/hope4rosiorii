// Compile-time guard, never run: `tsc` (and so CI) checks it.
//
// It proves that global.d.ts makes next-intl's hooks check message keys. Each
// `@ts-expect-error` line must be a type error; if typing ever stops working
// (say global.d.ts is deleted or its path breaks), those lines stop being
// errors and `tsc` fails with "Unused '@ts-expect-error' directive".
//
// It uses useTranslations because that is what reads the types from
// global.d.ts. createTranslator would not do: it infers its types from the
// `messages` object it is given, so it is typed with or without global.d.ts.
// The "use" prefix lets the hook be called outside a component.
import { useTranslations } from "next-intl";

export function useTypedMessagesGuard() {
  const t = useTranslations("DogsPage");

  t("filter.all"); // exists: fine

  // The bug that started this: "All" asked for a key that does not exist
  // @ts-expect-error: no such message
  t("filter.age.all");

  // @ts-expect-error: typo in a key
  t("filtr.all");

  // @ts-expect-error: a group of messages is not a message
  t("filter");

  // @ts-expect-error: unknown namespace
  useTranslations("NoSuchPage");
}
