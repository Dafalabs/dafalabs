import { getPathname } from "@/i18n/navigation";
import { routing, type Locale, type StaticPathname } from "@/i18n/routing";
import { SITE_URL } from "@/lib/api";

type Alternates = {
  canonical: string;
  languages: Record<string, string>;
};

function absolute(locale: Locale, pathname: StaticPathname) {
  return `${SITE_URL}${getPathname({ locale, href: pathname })}`;
}

function postUrl(locale: Locale, slug: string) {
  return `${SITE_URL}${getPathname({
    locale,
    href: { pathname: "/posts/[slug]" as const, params: { slug } },
  })}`;
}

export function pageAlternates(
  locale: Locale,
  pathname: StaticPathname,
): Alternates {
  const languages: Record<string, string> = {};

  for (const other of routing.locales) {
    languages[other] = absolute(other, pathname);
  }

  languages["x-default"] = absolute(routing.defaultLocale, pathname);

  return { canonical: absolute(locale, pathname), languages };
}

export function postAlternates(
  locale: Locale,
  slug: string,
  available: string[],
): Alternates {
  const languages: Record<string, string> = {};

  for (const other of routing.locales) {
    if (available.includes(other)) languages[other] = postUrl(other, slug);
  }

  const fallback = available.includes(routing.defaultLocale)
    ? routing.defaultLocale
    : available[0];

  if (fallback) languages["x-default"] = postUrl(fallback as Locale, slug);

  return { canonical: postUrl(locale, slug), languages };
}
