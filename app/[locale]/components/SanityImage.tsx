"use client";

import Image from "next/image";
import { hotspotPosition, sanityImageLoader } from "@/lib/sanity/image";

// A client component because <Image> is one, and a Server Component cannot
// pass it a function: `loader` would fail to serialize. The loader is imported
// here instead, so pages only pass plain data (strings, the hotspot object).
//
// Always `fill`: the parent must be `relative` and give the image its size.
//
// `eager` is for the image that is the main content above the fold (the
// likely Largest Contentful Paint). Images are lazy by default, which would
// delay it; eager loads it right away and `fetchPriority="high"` moves it up
// the queue. Leave it off for anything below the fold.
export default function SanityImage({
  src,
  alt,
  sizes,
  hotspot,
  className = "object-cover",
  eager = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  hotspot?: { x: number | null; y: number | null } | null;
  className?: string;
  eager?: boolean;
}) {
  return (
    <Image
      loader={sanityImageLoader}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={eager ? "eager" : undefined}
      fetchPriority={eager ? "high" : undefined}
      className={className}
      style={{ objectPosition: hotspotPosition(hotspot) }}
    />
  );
}
