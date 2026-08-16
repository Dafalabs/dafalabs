import "server-only";

import type { Locale } from "@/i18n/routing";

export type Social = { name: string; href: string };

export type SiteContact = {
  email: string;
  phone: string | null;
  location: string | null;
  socials: Social[];
};

export type ProjectText = { title: string; tagline: string };

export type Project = {
  id: string;
  image_url: string | null;
  tags: string[];
  url: string | null;
  tr: ProjectText;
  en: ProjectText;
};

export type SiteContent = {
  contact: SiteContact;
  projects: Project[];
};

const REVALIDATE_SECONDS = 30;

const FALLBACK: SiteContent = {
  contact: {
    email: "hello@dafalabs.com",
    phone: null,
    location: null,
    socials: [],
  },
  projects: [],
};

export async function getSiteContent(): Promise<SiteContent> {
  const base = process.env.API_INTERNAL_URL?.trim();
  if (!base) return FALLBACK;

  try {
    const response = await fetch(`${base}/site`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["site-content"] },
    });

    if (!response.ok) throw new Error(`API ${response.status}`);

    return (await response.json()) as SiteContent;
  } catch (error) {
    console.error("[dafalabs] site içeriği alınamadı:", error);
    return FALLBACK;
  }
}

export async function getProjects(locale: Locale) {
  const { projects } = await getSiteContent();
  return {
    items: projects.map((project) => ({
      ...project,
      content: project[locale],
    })),
  };
}

export const SITE_URL = process.env.SITE_URL?.trim() || "https://dafalabs.com";

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  tags: string[];
  published_at: string | null;
  reading_minutes: number;
  locales: string[];
};

export type PostDetail = PostSummary & { body: string };

export async function getPosts(locale: Locale): Promise<PostSummary[]> {
  const base = process.env.API_INTERNAL_URL?.trim();
  if (!base) return [];

  try {
    const response = await fetch(`${base}/yazilar?locale=${locale}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["posts"] },
    });

    if (!response.ok) return [];
    return (await response.json()) as PostSummary[];
  } catch (error) {
    console.error("[dafalabs] yazılar alınamadı:", error);
    return [];
  }
}

export async function getPost(
  locale: Locale,
  slug: string,
): Promise<PostDetail | null> {
  const base = process.env.API_INTERNAL_URL?.trim();
  if (!base) return null;

  try {
    const response = await fetch(
      `${base}/yazilar/${encodeURIComponent(slug)}?locale=${locale}`,
      { next: { revalidate: REVALIDATE_SECONDS, tags: ["posts"] } },
    );

    if (!response.ok) return null;
    return (await response.json()) as PostDetail;
  } catch (error) {
    console.error("[dafalabs] yazı alınamadı:", error);
    return null;
  }
}
