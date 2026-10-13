// Data access for donation impact updates. Components call getUpdates, never
// the Sanity client. Tagged "update" for the revalidation webhook
// (app/api/revalidate/route.ts).
import { cacheLife, cacheTag } from "next/cache";
import { client } from "@/lib/sanity/client";
import type { UPDATES_QUERY_RESULT } from "@/sanity.types";
import { UPDATES_QUERY } from "@/lib/sanity/queries";

export type DonationUpdate = UPDATES_QUERY_RESULT[number];

export async function getUpdates(locale: string): Promise<DonationUpdate[]> {
  "use cache";
  cacheTag("update");
  cacheLife("max");
  return client.fetch<UPDATES_QUERY_RESULT>(UPDATES_QUERY, { locale });
}
