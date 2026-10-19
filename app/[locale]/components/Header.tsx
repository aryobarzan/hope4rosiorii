"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { HandCoins } from "lucide-react";

// No "Home" entry: the logo links home.
const links = [
  { href: "/animals", key: "dogs" },
  { href: "/adopt", key: "adopt" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export default function Header() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  // Unique, SSR-safe id: links the button's aria-controls to the <nav>
  const navId = useId();
  // Needed only to give the button focus back after Escape; a ref does not
  // cause re-renders
  const menuButton = useRef<HTMLButtonElement>(null);

  // Remember the path the menu was opened on, instead of a plain boolean. The
  // menu is then "open" only while we are still on that path, so it closes by
  // itself after navigating, with no effect needed to reset it.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  // Derived on every render, not stored: a stale `openedAt` from another page
  // simply no longer matches
  const open = openedAt === pathname;

  // Subscribes to a browser event outside React, which is what effects are for
  useEffect(() => {
    // No listener while closed, so we are not handling every keystroke
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenedAt(null);
        // The focused link is about to disappear with the panel: send focus
        // back to the button that opened it, so keyboard users keep their place
        menuButton.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    // Cleanup runs when `open` changes or on unmount, so listeners do not pile up
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Links match their sub-pages too (e.g. /animals/rex)
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Also needed for a link to the current page: the path does not change then
  const close = () => setOpenedAt(null);

  return (
    // Sticky needs an opaque background, or the page scrolls visibly behind it.
    // The bar is full width; the inner container keeps the content aligned
    // with the pages. `relative` is already implied by `sticky`, so the mobile
    // menu panel can be positioned against the header.
    <header className="sticky top-0 z-50 border-b-2 border-pale bg-page">
      <div className="page-container flex items-center gap-2 py-2 lg:gap-8">
        <Link
          href="/"
          aria-label={`Hope 4 Rosiorii – ${t("home")}`}
          aria-current={pathname === "/" ? "page" : undefined}
          onClick={close}
          className="mr-auto flex items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:mr-0"
        >
          {/* unoptimized: tiny local logo, keep under Hobby's image-transformation limit */}
          <Image
            src="/images/logo.webp"
            width={64}
            height={64}
            alt=""
            unoptimized
            className="size-12 lg:size-16"
          />
          {/* Below 352px the logo has to do on its own */}
          <span className="flex flex-col max-[22rem]:hidden">
            <span className="font-heading text-xl text-ink sm:text-2xl">
              Hope 4 Rosiorii
            </span>
            <span className="hidden font-body text-sm uppercase sm:block">
              {t("tagline")}
            </span>
          </span>
        </Link>

        {/* DOM order is logo, menu button, nav, language switcher, so that
            keyboard users reach the panel right after the button that opens
            it. Below `lg` the nav is a panel under the bar, above it a row. */}
        <button
          ref={menuButton}
          type="button"
          aria-label={t("menu")}
          aria-expanded={open}
          aria-controls={navId}
          onClick={() => setOpenedAt(open ? null : pathname)}
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-pale bg-card text-ink transition-colors hover:border-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:hidden"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6 fill-none stroke-current stroke-2"
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        <nav
          id={navId}
          aria-label={t("label")}
          className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b-2 border-pale bg-page px-4 py-4 lg:static lg:ml-auto lg:flex lg:flex-row lg:items-center lg:gap-4 lg:border-0 lg:bg-transparent lg:p-0`}
        >
          {links.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              onClick={close}
              className="nav-link"
            >
              {t(key)}
            </Link>
          ))}
          {/* fill the width on mobile, shrink to content otherwise */}
          <Link
            href="/donate"
            aria-current={isActive("/donate") ? "page" : undefined}
            onClick={close}
            className="filled-button mt-2 w-full lg:mt-0 lg:w-auto"
          >
            <HandCoins aria-hidden="true" className="size-5" />
            {t("donate")}
          </Link>
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
