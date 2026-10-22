import { client } from "@/lib/sanity/client";

// Does an animal with this slug exist? Asked by proxy.ts before an animal page
// renders, so that an unknown address can answer a real 404. Once a page is
// streaming its status is already 200, and the only thing left is a noindex
// tag. Proxy runs for every request, so this has to be quick:
//
// - A slug that exists is remembered, and answered from memory afterwards.
// - A slug that does not exist is remembered for a short while, so a bot
//   hammering one bad address does not turn into a Sanity request each time.
// - Only the first time a slug is seen costs a Sanity request (the CDN, one
//   small boolean).
//
// The memory belongs to one server instance, so on Vercel each instance warms
// up separately. A removed animal stays "known" until its entry expires; its
// page then falls back to notFound() inside the page (status 200 + noindex).
const FOUND_TTL_MS = 10 * 60_000;
const MISSING_TTL_MS = 30_000;
// Keeps the memory bounded when someone requests endless made-up addresses
const MAX_ENTRIES = 500;

const found = new Map<string, number>(); // slug -> trusted until (ms)
const missing = new Map<string, number>();

const EXISTS_QUERY = `count(*[_type == "animal" && slug.current == $slug]) > 0`;

function remember(cache: Map<string, number>, slug: string, ttl: number) {
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(slug, Date.now() + ttl);
}

export async function animalExists(slug: string): Promise<boolean> {
  const now = Date.now();
  if ((found.get(slug) ?? 0) > now) return true;
  if ((missing.get(slug) ?? 0) > now) return false;

  try {
    const exists = await client.fetch<boolean>(EXISTS_QUERY, { slug });
    if (exists) {
      missing.delete(slug);
      remember(found, slug, FOUND_TTL_MS);
    } else {
      remember(missing, slug, MISSING_TTL_MS);
    }
    return exists;
  } catch (error) {
    // Fail open: if Sanity cannot be reached, let the page decide. Never turn
    // an outage into 404s for animals that do exist.
    console.error("Animal lookup failed", error);
    return true;
  }
}
