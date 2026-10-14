import { Suspense } from "react";
import type { Metadata } from "next";
import { Gochi_Hand, Nunito, Pinyon_Script } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import "../globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const gochiHand = Gochi_Hand({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gochi-hand",
});

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
});

const pinyonScript = Pinyon_Script({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-pinyon-script",
});

// TODO: replace with generateMetadata
export const metadata: Metadata = {
  // Pages set a short title (e.g. "Donate"); the template appends the site name.
  title: { default: "Hope 4 Rosiorii", template: "%s | Hope 4 Rosiorii" },
  description: "Dog adoption website",
};

// Pre-render one version of every page per locale
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html
      lang={locale}
      className={`${gochiHand.variable} ${nunito.variable} ${pinyonScript.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          {/* usePathname() is runtime data on routes whose params are not
              known at build time (e.g. /animals/[animal]), so with
              cacheComponents it must sit inside Suspense. Static routes still
              prerender the header into the shell. */}
          <Suspense fallback={null}>
            <Header />
          </Suspense>
          {/* Full width: pages decide their own container so they can have
              full-bleed bands (see .page-container) */}
          <main className="w-full flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
