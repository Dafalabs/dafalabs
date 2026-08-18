import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Archivo, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { Analytics, Consent } from "@/components/analytics";
import { Cursor } from "@/components/cursor";
import { SiteHeader } from "@/components/site-header";
import { SmoothScroll } from "@/components/smooth-scroll";
import { routing, type Locale } from "@/i18n/routing";
import { SITE_URL, getPosts, getSiteContent } from "@/lib/api";

import "../globals.css";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  variable: "--font-archivo",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
    openGraph: {
      type: "website",
      siteName: "dafalabs",
      locale: locale === "tr" ? "tr_TR" : "en_US",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const { contact, projects } = await getSiteContent();
  const posts = await getPosts(locale as Locale);
  const hasProjects = projects.length > 0;
  const hasPosts = posts.length > 0;
  const t = await getTranslations("nav");

  return (
    <html
      lang={locale}
      className={`${archivo.variable} ${instrument.variable} ${jetbrains.variable}`}
    >
      <body className="bg-ink text-bone antialiased">
        <Consent />

        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:z-100 focus:bg-brass focus:px-5 focus:py-3 focus:font-medium focus:text-ink"
          >
            {t("skip")}
          </a>

          <Analytics />
          <Cursor />

          <SmoothScroll>
            <SiteHeader hasProjects={hasProjects} hasPosts={hasPosts} />
            <main id="main">{children}</main>
            <SiteFooter contact={contact} hasProjects={hasProjects} hasPosts={hasPosts} />
          </SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
