// Data access for news posts. Components call getPosts / getPost, never the
// Sanity client. Tagged "post" for the revalidation webhook
// (app/api/revalidate/route.ts).
import { cacheLife, cacheTag } from "next/cache";
import { client } from "@/lib/sanity/client";
import type { POSTS_QUERY_RESULT } from "@/sanity.types";
import { POSTS_QUERY } from "@/lib/sanity/queries";

export type Post = POSTS_QUERY_RESULT[number];

export async function getPosts(locale: string): Promise<Post[]> {
  "use cache";
  cacheTag("post");
  // Nothing in a post depends on the current time, so no time-based refresh
  // is needed beyond the webhook.
  cacheLife("max");
  return client.fetch<POSTS_QUERY_RESULT>(POSTS_QUERY, { locale });
}

export async function getPost(slug: string, locale: string) {
  const posts = await getPosts(locale);
  return posts.find((post) => post.slug === slug);
}

export async function getLatestPosts(locale: string, count: number) {
  const posts = await getPosts(locale);
  return posts.slice(0, count);
}
