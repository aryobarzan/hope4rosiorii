import {
  ClipboardPlus,
  IdCard,
  Microchip,
  Syringe,
  Worm,
  type LucideIcon,
} from "lucide-react";

const HEALTH_ICONS: Record<string, LucideIcon> = {
  vaccinated: Syringe,
  microchipped: Microchip,
  dewormed: Worm,
  tested: ClipboardPlus,
  testedCat: ClipboardPlus,
  euPassport: IdCard,
};

// Decorative: the label next to it carries the meaning. An option the map does
// not know yet (e.g. one an editor adds in Sanity) falls back to a generic icon.
// Shared by the animal page and the preview card.
export default function HealthIcon({ health }: { health: string }) {
  const Icon = HEALTH_ICONS[health] ?? ClipboardPlus;
  return <Icon aria-hidden="true" className="size-5" />;
}
