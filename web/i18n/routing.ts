import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en"],
  defaultLocale: "tr",

  localePrefix: "always",

  pathnames: {
    "/": "/",
    "/services": {
      tr: "/hizmetler",
      en: "/services",
    },
    "/work": {
      tr: "/projeler",
      en: "/work",
    },
    "/posts": {
      tr: "/yazilar",
      en: "/writing",
    },
    "/posts/[slug]": {
      tr: "/yazilar/[slug]",
      en: "/writing/[slug]",
    },
    "/contact": {
      tr: "/iletisim",
      en: "/contact",
    },
    "/login": {
      tr: "/giris",
      en: "/login",
    },
    "/tracking": {
      tr: "/takip",
      en: "/tracking",
    },
    "/panel": {
      tr: "/panel",
      en: "/panel",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;

export type StaticPathname = Exclude<AppPathname, "/posts/[slug]">;
