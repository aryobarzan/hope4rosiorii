import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SiFacebook, SiInstagram, SiTiktok } from "react-icons/si";
import { Link } from "@/i18n/navigation";
import { getSiteSettings } from "@/lib/site-settings";

const linkClass =
  "rounded underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white font-bold";

const links = [
  { href: "/animals", key: "ourDogs", ns: "Footer" },
  { href: "/adopt", key: "adopt", ns: "Nav" },
  { href: "/about", key: "about", ns: "Nav" },
  { href: "/contact", key: "contact", ns: "Nav" },
  { href: "/donate", key: "donate", ns: "Nav" },
] as const;

export default async function Footer() {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const { contactEmail, facebookUrl, instagramUrl, tiktokUrl } =
    await getSiteSettings();
  const socials = [
    { platform: "Facebook", href: facebookUrl, Icon: SiFacebook },
    { platform: "Instagram", href: instagramUrl, Icon: SiInstagram },
    { platform: "TikTok", href: tiktokUrl, Icon: SiTiktok },
  ];

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
          <ul className="flex gap-1">
            {socials.map(({ platform, href, Icon }) => (
              <li key={platform}>
                {/* Brand names are not translated, so they double as the accessible name.
                    noreferrer implies noopener. */}
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <nav
          aria-label={t("navLabel")}
          className="flex flex-col gap-1 md:ml-auto"
        >
          <h2 className="font-bold text-white">{t("explore")}</h2>
          {links.map(({ href, key, ns }) => (
            <Link key={href} href={href} className={linkClass}>
              {ns === "Footer" ? t(key) : tNav(key)}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1">
          <h2 className="font-bold text-white">{t("sayHello")}</h2>
          <a href={`mailto:${contactEmail}`} className={linkClass}>
            {contactEmail}
          </a>
          <Link href="/privacy-policy" className={linkClass}>
            {t("privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
