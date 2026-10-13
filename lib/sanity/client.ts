import { createClient } from "next-sanity";

// Public, read-only client for published content. projectId and dataset are not
// secrets, so they use NEXT_PUBLIC_ env vars and are safe to import anywhere.
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2026-10-13", // keep hard-coded
  useCdn: true,
});
