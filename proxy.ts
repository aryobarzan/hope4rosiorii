import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { animalExists } from "./lib/animal-slugs";

const intlProxy = createMiddleware(routing);

// Looks like a locale code ("gn", "pt-BR") but isn't one of ours
const localeLike = /^[a-z]{2}(?:-[A-Za-z]{2})?$/;

// An animal's page: /en/animals/elli (a trailing slash is fine)
const animalPage = /^\/([^/]+)\/animals\/([^/]+)\/?$/;

// An address that no page matches, so app/[locale]/[...rest] answers it with
// notFound() and its 404. Used to turn an unknown animal into a real 404.
const NOT_FOUND_ADDRESS = "animal-not-found";

// A slug is plain text in the address. Anything that does not decode, or that
// is absurdly long, cannot be an animal.
function readSlug(segment: string) {
  try {
    const slug = decodeURIComponent(segment);
    return slug.length <= 200 ? slug : null;
  } catch {
    return null;
  }
}

// Next.js 16 renamed `middleware.ts` to `proxy.ts`
export default async function proxy(request: NextRequest) {
  const [, first, ...rest] = request.nextUrl.pathname.split("/");

  // /gn/animals -> /en/animals (otherwise next-intl would treat "gn" as a page and
  // redirect to /en/gn/animals, which is a 404)
  if (first && localeLike.test(first) && !hasLocale(routing.locales, first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${[routing.defaultLocale, ...rest].join("/")}`;
    return NextResponse.redirect(url);
  }

  // An unknown animal gets a real 404. This has to happen here, before the
  // page: an animal page that was not prerendered starts streaming at once, so
  // by the time the page finds out the animal is missing, the status is
  // already 200 and all notFound() can add is a noindex tag.
  const animal = request.nextUrl.pathname.match(animalPage);
  if (animal && hasLocale(routing.locales, animal[1])) {
    const slug = readSlug(animal[2]);
    if (slug === null || !(await animalExists(slug))) {
      const url = request.nextUrl.clone();
      url.pathname = `/${animal[1]}/${NOT_FOUND_ADDRESS}`;
      return NextResponse.rewrite(url);
    }
  }

  return intlProxy(request);
}

export const config = {
  // Skip API routes, Next internals, Vercel internals and files with an extension
  matcher: "/((?!api|trpc|_next|_vercel|.*[.].*).*)",
};
