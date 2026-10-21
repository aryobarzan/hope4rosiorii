import { describe, expect, it } from "vitest";
import de from "./de.json";
import en from "./en.json";
import fr from "./fr.json";
import lb from "./lb.json";

const locales = { lb, en, fr, de };
const reference = "lb"; // the default locale

// Flattens to { "DogsPage.filter.all": "All", "PrivacyPage.sections.0.title": ... }
function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  if (value === null || typeof value !== "object") return {};
  return Object.entries(value).reduce<Record<string, string>>(
    (acc, [key, child]) =>
      Object.assign(acc, flatten(child, prefix ? `${prefix}.${key}` : key)),
    {},
  );
}

// ICU arguments ({name}, {count, plural, ...}) and rich-text tags (<b>...</b>)
// must be the same in every language, or one of them renders wrongly.
function placeholders(message: string) {
  const args = [...message.matchAll(/\{(\w+)\s*[,}]/g)].map((m) => m[1]);
  const tags = [...message.matchAll(/<(\w+)>/g)].map((m) => `<${m[1]}>`);
  return [...new Set([...args, ...tags])].sort();
}

const flat = Object.fromEntries(
  Object.entries(locales).map(([locale, messages]) => [
    locale,
    flatten(messages),
  ]),
);
const keysOf = (locale: string) => Object.keys(flat[locale]).sort();

describe.each(Object.keys(locales).filter((l) => l !== reference))(
  "messages/%s.json",
  (locale) => {
    it(`has exactly the same keys as ${reference}.json`, () => {
      const expected = new Set(keysOf(reference));
      const actual = new Set(keysOf(locale));
      expect({
        missing: [...expected].filter((key) => !actual.has(key)),
        extra: [...actual].filter((key) => !expected.has(key)),
      }).toEqual({ missing: [], extra: [] });
    });

    it("uses the same placeholders as the reference for every message", () => {
      const mismatches = keysOf(reference)
        .filter((key) => key in flat[locale])
        .filter(
          (key) =>
            placeholders(flat[locale][key]).join() !==
            placeholders(flat[reference][key]).join(),
        )
        .map((key) => ({
          key,
          [reference]: placeholders(flat[reference][key]),
          [locale]: placeholders(flat[locale][key]),
        }));
      expect(mismatches).toEqual([]);
    });
  },
);

describe.each(Object.keys(locales))("messages/%s.json", (locale) => {
  it("has no empty messages", () => {
    const empty = Object.entries(flat[locale])
      .filter(([, message]) => message.trim() === "")
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });
});
