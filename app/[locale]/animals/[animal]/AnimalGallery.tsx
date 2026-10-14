"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import SanityImage from "../../components/SanityImage";

type Photo = {
  url: string;
  alt: string | null;
  hotspot: { x: number | null; y: number | null } | null;
};

// Shared by the close and arrow buttons: round, 44px touch target, readable on
// any photo thanks to the solid background. Hover tints it pink and pressing
// darkens it slightly and shrinks it a touch, so it feels clickable. `scale`
// is its own property in Tailwind v4, so it does not fight the arrows'
// -translate-y-1/2 centring.
const overlayButton =
  "absolute inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-card text-ink transition-[background-color,scale] hover:bg-pale active:scale-90 active:bg-blush focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

// A strip of thumbnails; tapping one opens the larger photo in an overlay.
//
// The overlay is a native <dialog> opened with showModal(), so the browser
// already provides what a hand-made overlay would need JavaScript for: focus
// moves into it and is trapped there, Escape closes it, focus returns to the
// thumbnail afterwards, and the rest of the page is inert while it is open.
export default function AnimalGallery({
  photos,
  name,
}: {
  photos: Photo[];
  name: string;
}) {
  const t = useTranslations("AnimalPage");
  const dialog = useRef<HTMLDialogElement>(null);
  // Which photo the overlay shows. The large image is only rendered while it
  // is open, so nothing extra is downloaded until someone taps a thumbnail.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const current = openIndex === null ? null : photos[openIndex];

  // Wraps around, so the arrows never end up disabled.
  function step(delta: number) {
    setOpenIndex((index) =>
      index === null ? null : (index + delta + photos.length) % photos.length,
    );
  }

  return (
    <>
      {/* overflow-x-auto also clips vertically, so the padding has to cover the
          blob's shadow (`.blob-frame`: about 20px below, 16px to the sides) and
          the focus outline. The negative margin cancels it out, so the layout
          is the same as without the padding. */}
      <ul className="-mx-4 -my-5 flex gap-3 overflow-x-auto px-4 py-5">
        {photos.map((photo, index) => (
          <li key={photo.url} className="shrink-0">
            <button
              type="button"
              aria-label={t("galleryOpen", {
                index: index + 1,
                total: photos.length,
              })}
              onClick={() => {
                setOpenIndex(index);
                dialog.current?.showModal();
              }}
              className="blob-frame relative block size-28 cursor-pointer bg-pale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:size-32"
            >
              {/* Empty alt: the button's label names the action, the picture
                  itself is decoration here. */}
              <SanityImage
                src={photo.url}
                alt=""
                sizes="128px"
                hotspot={photo.hotspot}
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={name}
        // Fires for Escape, the close button and backdrop clicks alike
        onClose={() => setOpenIndex(null)}
        // Focus is inside the dialog while it is open, so it receives the keys
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") step(-1);
          if (event.key === "ArrowRight") step(1);
        }}
        // No padding on the dialog, so a click whose target is the dialog
        // itself can only be a click on the backdrop around the content.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-ink/80"
      >
        {current && (
          <div className="relative h-[80dvh] w-[90vw] max-w-3xl overflow-hidden rounded-3xl bg-ink">
            <SanityImage
              src={current.url}
              alt={current.alt ?? name}
              sizes="(min-width: 768px) 768px, 90vw"
              hotspot={current.hotspot}
              className="object-contain"
            />
            <button
              type="button"
              aria-label={t("galleryClose")}
              onClick={() => dialog.current?.close()}
              className={`${overlayButton} right-2 top-2`}
            >
              <X aria-hidden="true" className="size-6" />
            </button>
            <button
              type="button"
              aria-label={t("galleryPrevious")}
              onClick={() => step(-1)}
              className={`${overlayButton} left-2 top-1/2 -translate-y-1/2`}
            >
              <ChevronLeft aria-hidden="true" className="size-6" />
            </button>
            <button
              type="button"
              aria-label={t("galleryNext")}
              onClick={() => step(1)}
              className={`${overlayButton} right-2 top-1/2 -translate-y-1/2`}
            >
              <ChevronRight aria-hidden="true" className="size-6" />
            </button>
            {/* Where you are in the strip; the live region makes screen
                readers announce the new position after each arrow press. */}
            <p
              aria-live="polite"
              className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-card px-3 py-1 text-sm font-bold text-ink"
            >
              {openIndex! + 1} / {photos.length}
            </p>
          </div>
        )}
      </dialog>
    </>
  );
}
