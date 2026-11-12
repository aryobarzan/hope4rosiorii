// Shared look of the tiles in the video strip: the YouTube play button and the
// link tiles for other sites. Both are a dark rounded box with a pink circle
// in the middle, so a mix of them still reads as one row.
//
// `group` lets the circle react to the whole tile: it turns white on hover and
// shrinks while the tile is pressed.
export const tile =
  "group aspect-video w-[min(85vw,24rem)] shrink-0 snap-start overflow-hidden rounded-3xl";

// cursor-pointer: Tailwind v4 no longer gives <button> a pointer cursor (links
// have one anyway), so it is set here for both kinds of tile.
export const tileButton = `${tile} cursor-pointer flex flex-col items-center justify-center gap-3 bg-ink p-6 text-center text-white transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink),white_12%)] active:bg-[color-mix(in_srgb,var(--color-ink),black_25%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`;

export const tileCircle =
  "flex size-16 items-center justify-center rounded-full bg-button text-white transition-[scale,background-color,color] duration-150 group-hover:bg-white group-hover:text-button group-active:scale-90 group-active:bg-pale group-active:text-button";
