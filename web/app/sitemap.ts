import type { MetadataRoute } from "next";

import { getPathname } from "@/i18n/navigation";
import { routing, type StaticPathname } from "@/i18n/routing";
import { SITE_URL, getPosts, getSiteContent } from "@/lib/api";

export const revalidate = 30;

const STATIC_PAGES: StaticPathname[] = [
  "/",
  "/services",
  "/posts",
  "/contact",
];

function entry(pathname: StaticPathname) {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [
      locale,
      `${SITE_URL}${getPathname({ locale, href: pathname })}`,
    ]),
  );

  return {
    url: languages[routing.defaultLocale],
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { projects } = await getSiteContent();
  const pages = projects.length
    ? [...STATIC_PAGES, "/work" as const]
    : STATIC_PAGES;

  const perLocale = await Promise.all(
    routing.locales.map(async (locale) => {
      const posts = await getPosts(locale);

      return posts.map((post) => ({
        url: `${SITE_URL}${getPathname({
          locale,
          href: { pathname: "/posts/[slug]" as const, params: { slug: post.slug } },
        })}`,
        lastModified: post.published_at ? new Date(post.published_at) : undefined,
      }));
    }),
  );

  return [...pages.map(entry), ...perLocale.flat()];
}
