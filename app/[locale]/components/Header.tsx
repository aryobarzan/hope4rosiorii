"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import styles from "@/app/[locale]/components/Header.module.css";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

// No "Home" entry: the logo links home.
const links = [
  { href: "/dogs", key: "dogs" },
  { href: "/adopt", key: "adopt" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export default function Header() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  // Links match their sub-pages too (e.g. /dogs/rex)
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="page-container flex items-center gap-16">
      <Link
        href="/"
        aria-label={`Hope 4 Rosiorii – ${t("home")}`}
        aria-current={pathname === "/" ? "page" : undefined}
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
        <Link
          href="/donate"
          aria-current={isActive("/donate") ? "page" : undefined}
          className="filled-button"
        >
          {t("donate")}
        </Link>
      </nav>
      <LanguageSwitcher />
    </header>
  );
}
