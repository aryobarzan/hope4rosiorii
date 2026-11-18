import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("PostPage");
  return (
    <div className="page-container page-section flex flex-col items-center gap-2">
      <h1 className="font-heading text-3xl">{t("notFoundTitle")}</h1>
      <p>{t("notFound")}</p>
      <Link href="/news" className="outlined-button mt-2">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t("backToNews")}
      </Link>
    </div>
  );
}
