import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  // Only the production deployment should be indexed. Vercel preview URLs
  // (one per branch or commit) would otherwise compete with the real site.
  // VERCEL_ENV is "production", "preview" or "development"; it is unset locally.
  if (process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
