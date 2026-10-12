import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getDog } from "@/lib/dogs";
import ContactForm from "./ContactForm";
const linkClass =
  "rounded underline underline-offset-4 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

// With cacheComponents, searchParams is runtime data and must be read inside
// <Suspense>. Isolating it here keeps the rest of the page prerendered; only
// the form streams in. An unknown or repeated slug is ignored.
async function PrefilledContactForm({
  searchParams,
}: {
  searchParams: Promise<{ dog?: string | string[] }>;
}) {
  const { dog: slug } = await searchParams;
  const dog = typeof slug === "string" ? await getDog(slug) : undefined;
  // key: useForm only reads defaultValues on mount, so a different dog has to
  // remount the form or the previous dog's name would stay in the message.
  return <ContactForm key={dog?.slug ?? "no-dog"} dogName={dog?.name} />;
}

export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ dog?: string | string[] }>;
}) {
  const t = await getTranslations("ContactPage");

  return (
    <div className="page-container flex flex-col gap-1 pb-8 pt-8">
      <p className="font-heading text-xl text-link">{t("eyebrow")}</p>
      <h1 className="font-heading text-5xl">{t("heading")}</h1>
      {/* Stacked on small screens; side by side from lg. items-start stops the
          box stretching to the form's height, so it only takes what it needs. */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* The fallback is the plain form, so the layout does not jump. */}
        <Suspense fallback={<ContactForm />}>
          <PrefilledContactForm searchParams={searchParams} />
        </Suspense>
        <div className="flex flex-col gap-1 prominent-box">
          <p className="font-bold">{t("email")}</p>
          {/* self-start so it shrinks to its content's width */}
          <a
            href="mailto:hope4rosiorii@gmail.com"
            className={`${linkClass} self-start`}
          >
            hope4rosiorii@gmail.com
          </a>
          <p className="font-bold mt-4">{t("followUs")}</p>
          <p>
            <a
              href="https://www.instagram.com/hope4rosiorii/"
              target="_blank"
              className={linkClass}
            >
              Instagram
            </a>{" "}
            ·{" "}
            <a
              href="https://www.facebook.com/profile.php?id=61567775880000"
              target="_blank"
              className={linkClass}
            >
              Facebook
            </a>{" "}
            ·{" "}
            <a
              href="https://www.tiktok.com/@hope4rosiorii"
              target="_blank"
              className={linkClass}
            >
              TikTok
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
