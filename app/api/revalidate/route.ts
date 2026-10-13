import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

// Sanity webhook target. The webhook's projection sends the changed
// document's type, e.g. { "tags": ["animal"] }, and the same string is the
// cacheTag used in lib/animals.ts, lib/updates.ts and lib/site-settings.ts.
// Tags are not per locale, so one call
// refreshes every language. No locale is needed here (next/root-params does
// not work in Route Handlers, see AGENTS.md).
const ALLOWED_TAGS = new Set(["animal", "update", "siteSettings"]);

type WebhookPayload = { tags?: string[] };

export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return new Response("Revalidation secret is not configured", {
      status: 500,
    });
  }

  try {
    // `true`: wait briefly so Sanity's CDN has the new content before we refetch.
    const { isValidSignature, body } = await parseBody<WebhookPayload>(
      req,
      secret,
      true,
    );
    if (!isValidSignature) {
      return new Response("Invalid signature", { status: 401 });
    }

    const tags = (body?.tags ?? []).filter((tag) => ALLOWED_TAGS.has(tag));
    if (tags.length === 0) {
      return new Response("No known tags", { status: 400 });
    }

    // "max": stale-while-revalidate, the recommended profile for Next 16.
    // Lazy: this only marks the entries outdated, nothing is fetched now. The
    // next request may still get the old data once while a fresh fetch runs.
    for (const tag of tags) revalidateTag(tag, "max");
    return NextResponse.json({ revalidated: tags });
  } catch {
    return new Response("Bad request", { status: 400 });
  }
}
