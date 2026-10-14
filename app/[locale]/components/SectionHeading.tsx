// Eyebrow plus <h2> used by the home page's sections, so their sizes and
// spacing cannot drift apart. The page's single <h1> is the hero heading and
// is written out there. `light` is for headings on the dark pink band.
export default function SectionHeading({
  eyebrow,
  heading,
  light = false,
}: {
  eyebrow?: string;
  heading: string;
  light?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {eyebrow && <p className="font-heading text-xl text-link">{eyebrow}</p>}
      <h2 className={`font-heading text-5xl ${light ? "text-white" : ""}`}>
        {heading}
      </h2>
    </div>
  );
}
