import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const linkClass =
  "rounded font-bold text-link underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const reasons = [
  "general",
  "dogs",
  "volunteer",
  "donate",
  "partnership",
  "other",
] as const;

export default function Contact() {
  const t = useTranslations("ContactPage");

  return (
    <div className="flex flex-col gap-1">
      <p className="font-heading text-xl text-brand">{t("eyebrow")}</p>
      <h1 className="font-heading text-5xl">{t("heading")}</h1>
      <form className="form-box mt-4 gap-4">
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="form-label">
              {t("name")}
            </label>
            <input id="name" type="text" className="input-field" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="form-label">
              {t("email")}
            </label>
            <input id="email" type="email" className="input-field" />
          </div>
        </div>
        <label htmlFor="reason" className="form-label">
          {t("reason")}
        </label>
        <div className="relative">
          <select id="reason" defaultValue="" className="input-field">
            <option value="" disabled>
              {t("reasonPlaceholder")}
            </option>
            {reasons.map((key) => (
              <option key={key} value={key}>
                {t(`reasons.${key}`)}
              </option>
            ))}
          </select>
          {/* select.input-field has appearance: none, so draw the arrow ourselves */}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 fill-none stroke-current stroke-2"
          >
            <path
              d="m5 8 5 5 5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <label htmlFor="message" className="form-label">
          {t("message")}
        </label>
        <textarea
          id="message"
          className="input-field textarea-field"
        ></textarea>
        <div className="flex flex-row items-center gap-2">
          <button className="filled-button">{t("submit")}</button>
          <p>
            {t.rich("adoptPrompt", {
              link: (chunks) => (
                <Link href="/adopt" className={linkClass}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
      </form>
    </div>
  );
}
