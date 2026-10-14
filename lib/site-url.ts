// Canonical origin of the site, used for absolute URLs (sitemap, robots, and
// later metadataBase and Open Graph). Set SITE_URL in Vercel to override it,
// e.g. while the real domain is not connected yet. No trailing slash.
export const siteUrl = (
  process.env.SITE_URL ?? "https://hope4rosiorii.lu"
).replace(/\/+$/, "");
