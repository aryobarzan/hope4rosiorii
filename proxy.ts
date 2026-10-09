import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlProxy = createMiddleware(routing);

// Looks like a locale code ("gn", "pt-BR") but isn't one of ours
const localeLike = /^[a-z]{2}(?:-[A-Za-z]{2})?$/;

// Next.js 16 renamed `middleware.ts` to `proxy.ts`
export default function proxy(request: NextRequest) {
  const [, first, ...rest] = request.nextUrl.pathname.split("/");

  // /gn/dogs -> /en/dogs (otherwise next-intl would treat "gn" as a page and
  // redirect to /en/gn/dogs, which is a 404)
  if (first && localeLike.test(first) && !hasLocale(routing.locales, first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${[routing.defaultLocale, ...rest].join("/")}`;
    return NextResponse.redirect(url);
  }

  return intlProxy(request);
}

export const config = {
  // Skip API routes, Next internals, Vercel internals and files with an extension
  matcher: "/((?!api|trpc|_next|_vercel|.*[.].*).*)",
};
