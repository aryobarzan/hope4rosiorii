import { PawPrint } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAnimals } from "@/lib/animals";

// The hero's link to the dogs page. Hidden while there are no animals at all,
// so it never leads to an empty list.
export default async function MeetTheDogsButton() {
  const t = await getTranslations("HomePage");
  const locale = await getLocale();
  const animals = await getAnimals(locale);

  if (animals.length === 0) return null;

  return (
    <Link
      href={{ pathname: `/animals` }}
      className="filled-button font-bold self-start"
    >
      <PawPrint aria-hidden="true" className="size-5" />

      {t("meetTheDogs")}
    </Link>
  );
}
