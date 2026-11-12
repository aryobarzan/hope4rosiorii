import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { videoHost, videoLabel, youtubeVideoId } from "@/lib/video";
import YouTubeEmbed from "./YouTubeEmbed";
import { tileButton, tileCircle } from "./video-tile";

// The animal's video links as a horizontal strip of equally sized tiles, in
// the order the team entered them. A single YouTube video is embedded (play
// button); every other link (Instagram, Facebook, a YouTube channel...) is a
// tile that opens in a new tab. Links that are not web addresses are dropped.
export default function AnimalVideos({
  videos,
  name,
}: {
  videos: string[];
  name: string;
}) {
  const t = useTranslations("AnimalPage");

  const items = videos.flatMap((url) => {
    if (!videoHost(url)) return [];
    return [
      { url, youtubeId: youtubeVideoId(url), label: videoLabel(url) ?? url },
    ];
  });
  if (items.length === 0) return null;

  return (
    <section className="w-full">
      <div className="page-container page-section section-stack">
        <h2 className="font-heading text-5xl">{t("videosHeading")}</h2>
        {/* overflow-x-auto also clips vertically, so the padding keeps the
            focus outline visible. Its negative margin cancels the page's side
            padding, so the strip scrolls edge to edge. */}
        <ul className="-mx-4 -my-2 flex snap-x gap-4 overflow-x-auto px-4 py-2">
          {items.map(({ url, youtubeId, label }) => (
            <li key={url} className="flex shrink-0">
              {youtubeId ? (
                <YouTubeEmbed id={youtubeId} name={name} />
              ) : (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={tileButton}
                >
                  <span className={tileCircle}>
                    <ExternalLink aria-hidden="true" className="size-7" />
                  </span>
                  <span className="font-heading text-3xl">
                    {t("videoWatchOn", { platform: label })}
                  </span>
                  <span className="sr-only">{t("videoNewTab")}</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
