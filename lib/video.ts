// Helpers for the video links on an animal (`videos` in the Sanity schema: a
// list of plain https URLs). Plain TypeScript with no React.

export type VideoHost = "youtube" | "instagram" | "facebook" | "other";

// Brand names are not translated, so they live here and not in the messages.
const KNOWN_HOSTS: { host: Exclude<VideoHost, "other">; label: string; domains: string[] }[] = [
  {
    host: "youtube",
    label: "YouTube",
    domains: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
  },
  { host: "instagram", label: "Instagram", domains: ["instagram.com", "instagr.am"] },
  { host: "facebook", label: "Facebook", domains: ["facebook.com", "fb.com", "fb.watch"] },
];

// Parses the link and checks it is a web address. Anything else (a typo, or
// `javascript:` and other schemes) gives null, so it can never become a link.
function parseVideoUrl(url: string): URL | null {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed : null;
  } catch {
    return null;
  }
}

// The domain itself or any subdomain of it ("www.", "m.", "music."), but not a
// look-alike such as "notyoutube.com".
function isDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

// Which site a video link points to: "youtube", "instagram", "facebook" or
// "other" for any other web address. Null when it is not a usable web address.
export function videoHost(url: string): VideoHost | null {
  const parsed = parseVideoUrl(url);
  if (!parsed) return null;
  const hostname = parsed.hostname.toLowerCase();
  const known = KNOWN_HOSTS.find(({ domains }) =>
    domains.some((domain) => isDomain(hostname, domain)),
  );
  return known?.host ?? "other";
}

// The name to show on the button for a link: "YouTube", "Instagram",
// "Facebook", or the site's own name ("vimeo.com") for any other. Null when it
// is not a usable web address.
export function videoLabel(url: string): string | null {
  const parsed = parseVideoUrl(url);
  if (!parsed) return null;
  const host = videoHost(url);
  const known = KNOWN_HOSTS.find((entry) => entry.host === host);
  return known?.label ?? parsed.hostname.toLowerCase().replace(/^www\./, "");
}

// The 11-character ID of a YouTube video, from any of its link forms:
// watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID, /live/ID. Null for other
// sites and for YouTube links that are not a single video (a channel or a
// playlist), which are better shown as a plain button.
export function youtubeVideoId(url: string): string | null {
  if (videoHost(url) !== "youtube") return null;
  const parsed = parseVideoUrl(url);
  if (!parsed) return null;

  const segments = parsed.pathname.split("/").filter(Boolean);
  const candidate =
    parsed.hostname.toLowerCase() === "youtu.be"
      ? segments[0]
      : ["shorts", "embed", "live", "v"].includes(segments[0])
        ? segments[1]
        : segments[0] === "watch"
          ? parsed.searchParams.get("v")
          : null;
  // IDs are letters, digits, "-" and "_". Checking the shape keeps anything
  // else out of the embed address.
  return candidate && /^[\w-]{11}$/.test(candidate) ? candidate : null;
}
