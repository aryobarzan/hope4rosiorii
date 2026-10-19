import type { LucideIcon } from "lucide-react";

// Purely decorative background icon. Server component on purpose: Lucide
// components are functions/objects and can't be passed as props into client
// components. The parent needs `relative isolate overflow-hidden` so the icon
// positions against it, stays behind the content and can't cause page scroll.
export default function DecorativeIcon({
  // destructure: take prop `icon` and rename the local version to `Icon`.
  // we need the capital letter, otherwise <icon/> would be treated as an HTML tag,
  // rather than a JSX component (<Icon/>).
  icon: Icon,
  className = "",
  filled = true,
  strokeWidth = 2,
}: {
  // type annotation
  icon: LucideIcon;
  className?: string;
  filled?: boolean;
  strokeWidth?: number;
}) {
  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      fill={filled ? "currentColor" : "none"}
      strokeWidth={strokeWidth}
      className={`pointer-events-none absolute -z-10 select-none ${className}`}
    />
  );
}
