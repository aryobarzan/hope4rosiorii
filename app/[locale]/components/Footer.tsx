import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const linkClass =
  "rounded underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white font-bold";

const links = [
  { href: "/dogs", key: "ourDogs", ns: "Footer" },
  { href: "/adopt", key: "adopt", ns: "Nav" },
  { href: "/about", key: "about", ns: "Nav" },
  { href: "/contact", key: "contact", ns: "Nav" },
  { href: "/donate", key: "donate", ns: "Nav" },
] as const;

export default function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");

  return (
    <footer className="w-full bg-plum px-6 py-10 text-blush">
      <div className="mx-auto flex max-w-5xl flex-wrap gap-x-16 gap-y-8">
        <div className="flex max-w-xs flex-col gap-2">
          <div className="flex items-center gap-4">
            {/* unoptimized: tiny local logo, keep under Hobby's image-transformation limit */}
            <Image
              src="/images/logo.webp"
              width={64}
              height={64}
              alt=""
              unoptimized
            />
            <span className="font-heading text-3xl font-bold text-white">
              Hope 4 Rosiorii
            </span>
          </div>
          <p>{t("tagline")}</p>
        </div>
        <nav aria-label={t("navLabel")} className="flex flex-col gap-1">
          <h2 className="font-bold text-white">{t("explore")}</h2>
          {links.map(({ href, key, ns }) => (
            <Link key={href} href={href} className={linkClass}>
              {ns === "Footer" ? t(key) : tNav(key)}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1">
          <h2 className="font-bold text-white">{t("sayHello")}</h2>
          <a href="mailto:hope4rosiorii@gmail.com" className={linkClass}>
            hope4rosiorii@gmail.com
          </a>
          <Link href="/privacy-policy" className={linkClass}>
            {t("privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
// TODO: add socials
