"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { tile, tileButton, tileCircle } from "./video-tile";

// A YouTube video that loads only after a click. Until then nothing is
// requested from YouTube (not even a thumbnail, which would tell Google the
// visitor was here), and the embed uses the youtube-nocookie.com address.
export default function YouTubeEmbed({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const t = useTranslations("AnimalPage");
  const [playing, setPlaying] = useState(false);
  const iframe = useRef<HTMLIFrameElement>(null);

  // The button disappears when it is pressed, so keyboard users would lose
  // their place. Move focus to the video instead.
  useEffect(() => {
    if (playing) iframe.current?.focus();
  }, [playing]);

  if (playing) {
    return (
      <iframe
        ref={iframe}
        className={tile}
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={t("videoTitle", { name })}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className={tileButton}
    >
      <span className={tileCircle}>
        <Play aria-hidden="true" className="size-8 fill-current" />
      </span>
      <span className="font-heading text-3xl">{t("videoPlay")}</span>
      <span className="text-sm">{t("videoPrivacy")}</span>
    </button>
  );
}
