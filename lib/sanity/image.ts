// Custom next/image loader that points straight at Sanity's image CDN, so
// resizing is done by Sanity and does not count against Vercel Hobby's
// image-transformation limit. Use it with
// <Image loader={sanityImageLoader} />.
//
// `src` is the asset URL from the GROQ projection (`asset->url`).
export function sanityImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  return url.toString();
}

// Sanity's hotspot is {x, y} in 0..1. As an object-position it keeps the
// editor's chosen focal point visible when `object-cover` crops the photo.
// (The crop rectangle is not applied, only the hotspot.)
export function hotspotPosition(
  hotspot?: { x: number | null; y: number | null } | null,
) {
  return hotspot?.x != null && hotspot.y != null
    ? `${(hotspot.x * 100).toFixed(1)}% ${(hotspot.y * 100).toFixed(1)}%`
    : "50% 50%";
}
