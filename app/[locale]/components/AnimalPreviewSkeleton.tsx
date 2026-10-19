import { useTranslations } from "next-intl";

// Placeholder for AnimalPreviewCard while the page reads ?dog=. Fixed height,
// so the sidebar does not jump when the preview streams in. With no ?dog= the
// box simply disappears below the other sidebar content, so nothing visible
// moves.
export default function AnimalPreviewSkeleton() {
  const t = useTranslations("AnimalPreview");
  return (
    <div
      role="status"
      className="h-96 animate-pulse rounded-3xl bg-pale motion-reduce:animate-none"
    >
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
