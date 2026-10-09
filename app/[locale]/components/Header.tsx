"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import styles from "@/app/[locale]/components/Header.module.css";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const links = [
  { href: "/", key: "home" },
  { href: "/dogs", key: "dogs" },
  { href: "/adopt", key: "adopt" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
  { href: "/donate", key: "donate" },
] as const;

export default function Header() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  // "/" only matches exactly; other links also match their sub-pages (e.g. /dogs/rex)
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="flex items-center gap-16">
      <Link
        href="/"
        className="flex items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {/* unoptimized: tiny local logo, keep under Hobby's image-transformation limit */}
        <Image
          src="/images/logo.webp"
          width={64}
          height={64}
          alt=""
          unoptimized
        />
        <span className="flex flex-col">
          <span className="font-heading text-2xl text-ink">
            Hope 4 Rosiorii
          </span>
          <span className="font-body text-sm uppercase">{t("tagline")}</span>
        </span>
      </Link>
      <nav
        aria-label={t("label")}
        className={`${styles.navBar} ${styles.navLinks}`}
      >
        {links.map(({ href, key }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={
              isActive(href)
                ? `${styles.navLink} ${styles.navLinkActive}`
                : styles.navLink
            }
          >
            {t(key)}
          </Link>
        ))}
      </nav>
      <LanguageSwitcher />
    </header>
  );
}
