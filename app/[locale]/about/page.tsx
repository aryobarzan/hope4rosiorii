import { useTranslations } from "next-intl";
import { SiFacebook, SiInstagram, SiTiktok } from "react-icons/si";

const volunteers = [
  {
    id: 1,
    name: "[NAME]",
    position: "[position]",
    caption: "[caption]",
  },
  {
    id: 2,
    name: "[NAME]",
    position: "[position]",
    caption: "[caption]",
  },
  {
    id: 3,
    name: "[NAME]",
    position: "[position]",
    caption: "[caption]",
  },
  {
    id: 4,
    name: "[NAME]",
    position: "[position]",
    caption: "[caption]",
  },
];

// TODO: replace with each volunteer's real profile URLs (placeholders for now)
const socials = [
  { platform: "Facebook", href: "https://facebook.com", Icon: SiFacebook },
  { platform: "Instagram", href: "https://instagram.com", Icon: SiInstagram },
  { platform: "TikTok", href: "https://tiktok.com", Icon: SiTiktok },
];

export default function About() {
  const t = useTranslations("AboutPage");

  return (
    <div className="flex flex-col w-full">
      {/* Stacked on small screens; text left and picture right from md */}
      <section className="page-container flex flex-col gap-8 pb-8 pt-8 md:flex-row md:items-center">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-heading text-xl text-link">{t("eyebrow")}</p>
            <h1 className="font-heading text-5xl">{t("heading")}</h1>
          </div>
          <p className="font-body">{t("origins")}</p>
          <p className="font-body">{t("values")}</p>
        </div>
        {/* shrink-0 keeps it from being squashed by the text column.
            TODO: replace with the real team photo (next/image, meaningful alt) */}
        <div className="picture-placeholder blob-frame aspect-square w-full max-w-xs shrink-0 self-center md:w-80" />
      </section>

      {/* Full-bleed band: colour on the outer element, container inside */}
      <section className="w-full bg-pale">
        <div className="page-container flex flex-col gap-1 pt-8 pb-8">
          <h2 className="font-heading text-5xl">{t("headingVolunteers")}</h2>
          <ul className="volunteer-grid pt-4">
            {volunteers.map((volunteer) => (
              <li key={volunteer.id} className="volunteer-card">
                <div className="picture-placeholder blob-frame w-24 h-24" />
                <p className="font-heading text-3xl font-bold">
                  {volunteer.name}
                </p>
                <p className="font-body text-link font-bold">
                  {volunteer.position}
                </p>
                <p className="font-body">{volunteer.caption}</p>
                <div className="flex gap-2">
                  {socials.map(({ platform, href, Icon }) => (
                    // noreferrer: do not send Referer header to social media websites, e.g.,
                    // Facebook does not know the visitor came from hope4rosiorii.lu.
                    // noopener: "reverse tabnabbing" - sets window.opener to null in the new tab,
                    // such that there is no reference to this page.
                    // note: noreferrer imiplies noopener. modern browsers also already apply noopener by default for target _blank.
                    <a
                      key={platform}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("socialLabel", {
                        name: volunteer.name,
                        platform,
                      })}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-link hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      <Icon className="h-6 w-6" aria-hidden />
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
