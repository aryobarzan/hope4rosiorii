import { getLocale } from "next-intl/server";
import { getUpdates } from "@/lib/updates";
import UpdateRow from "./UpdateRow";

const MAX_UPDATES = 2;

// The newest donation updates for the home page. getUpdates already returns
// them newest first.
export default async function RecentUpdates() {
  const locale = await getLocale();
  const updates = (await getUpdates(locale)).slice(0, MAX_UPDATES);

  if (updates.length === 0) return null;

  return (
    <ul className="flex flex-col gap-4">
      {updates.map((update) => (
        <UpdateRow key={update._id} update={update} />
      ))}
    </ul>
  );
}
