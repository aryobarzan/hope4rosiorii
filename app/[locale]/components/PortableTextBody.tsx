import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { PawPrint } from "lucide-react";
import { safeHttpUrl } from "@/lib/safe-url";

// Source: https://github.com/portabletext/react-portabletext
// Tailwind's reset removes the browser's default heading, list and link
// styling, so each block type gets its look here. Shared by events and news.
// The schema only allows h2, h3, blockquote, bullet and numbered lists and
// links, so that is all there is to map. A server component: no JavaScript is
// sent to the browser for it.
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h2: ({ children }) => <h2 className="text-3xl">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl">{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-brand pl-4 italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      // list-style is removed (the paw replaces the dot), and Safari with
      // VoiceOver then stops announcing it as a list, so role="list" puts that back.
      <ul role="list" className="flex flex-col gap-1.5">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="flex list-decimal flex-col gap-1 pl-6">{children}</ol>
    ),
  },
  listItem: {
    // A paw print instead of the dot. Positioned absolutely, so the <li> stays
    // a normal block and wrapped lines align with the first one.
    bullet: ({ children }) => (
      <li className="relative pl-7">
        <PawPrint aria-hidden="true" className="absolute left-0 top-1 size-4" />
        {children}
      </li>
    ),
    // Supplying `listItem` replaces the library's whole default map, so every
    // style the schema allows needs an entry, or it logs "Unknown list item
    // style". A plain <li>: the browser's own numbers come from the <ol>.
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    link: ({ value, children }) => {
      const href = safeHttpUrl(value?.href);
      // An unusable link (or a non-http one) degrades to plain text.
      if (!href) return <>{children}</>;
      return (
        <a
          href={href}
          className="text-link underline underline-offset-2"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
  },
};

export default function PortableTextBody({
  value,
}: {
  value: Parameters<typeof PortableText>[0]["value"];
}) {
  return (
    <div className="flex flex-col gap-4">
      <PortableText value={value} components={components} />
    </div>
  );
}
