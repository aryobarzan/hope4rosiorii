// Data access for the siteSettings singleton. Components call getSiteSettings,
// never the Sanity client. Tagged "siteSettings" for the revalidation webhook
// (app/api/revalidate/route.ts).
import { cacheLife, cacheTag } from "next/cache";
import { client } from "@/lib/sanity/client";
import type { SITE_SETTINGS_QUERY_RESULT } from "@/sanity.types";
import { SITE_SETTINGS_QUERY } from "@/lib/sanity/queries";

// Used until the editors fill in the Site settings document, and for any
// field they leave empty.
const SETTINGS_DEFAULTS = {
  contactEmail: "hope4rosiorii@gmail.com",
  instagramUrl: "https://www.instagram.com/hope4rosiorii/",
  facebookUrl: "https://www.facebook.com/profile.php?id=61567775880000",
  tiktokUrl: "https://www.tiktok.com/@hope4rosiorii",
  bank: {
    iban: "LU96 0030 7235 0218 1000",
    bic: "BGLLLULL",
    accountName: "[account name]",
  },
  impactAmounts: { food: 5, vaccination: 50, crate: 50, journey: 100 },
};

export async function getSiteSettings() {
  "use cache";
  cacheTag("siteSettings");
  cacheLife("max");

  const s = await client.fetch<SITE_SETTINGS_QUERY_RESULT>(SITE_SETTINGS_QUERY);
  const d = SETTINGS_DEFAULTS;
  return {
    contactEmail: s?.contactEmail ?? d.contactEmail,
    instagramUrl: s?.socialLinks?.instagram ?? d.instagramUrl,
    facebookUrl: s?.socialLinks?.facebook ?? d.facebookUrl,
    tiktokUrl: s?.socialLinks?.tiktok ?? d.tiktokUrl,
    bank: {
      iban: s?.bank?.iban ?? d.bank.iban,
      bic: s?.bank?.bic ?? d.bank.bic,
      accountName: s?.bank?.accountName ?? d.bank.accountName,
    },
    impactAmounts: {
      food: s?.impactAmounts?.food ?? d.impactAmounts.food,
      vaccination: s?.impactAmounts?.vaccination ?? d.impactAmounts.vaccination,
      crate: s?.impactAmounts?.crate ?? d.impactAmounts.crate,
      journey: s?.impactAmounts?.journey ?? d.impactAmounts.journey,
    },
  };
}
