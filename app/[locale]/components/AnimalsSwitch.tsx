import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Switches between the two animal pages: those looking for a home and the
// happy endings. Shown at the top of both, so the animals page stays one tap
// from the header and happy endings are reachable without a header item.
// Same look as the species links on the animals page.
export default function AnimalsSwitch({
  current,
}: {
  current: "available" | "happyEndings";
}) {
  const t = useTranslations("AnimalsSwitch");
  const items = [
    { key: "available", href: "/animals" },
    { key: "happyEndings", href: "/happy-endings" },
  ] as const;

  return (
    <nav aria-label={t("label")} className="flex flex-wrap items-center gap-2">
      {items.map(({ key, href }) => {
        const selected = current === key;
        return (
          <Link
            key={key}
            href={href}
            aria-current={selected ? "page" : undefined}
            // .filled-button has no border, .outlined-button has 1.5px. A
            // transparent border of the same width keeps both the same size.
            className={`${selected ? "filled-button border-[1.5px] border-solid border-transparent" : "outlined-button"} font-bold`}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
