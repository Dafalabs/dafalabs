import "server-only";

import { cookies } from "next/headers";

export type AdminMessage = {
  id: number;
  tracking_code: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  answered_at: string | null;
  notified_at: string | null;
  replied_at: string | null;
  mail_error: string | null;
};

export type AdminMessageList = {
  items: AdminMessage[];
  total: number;
  page: number;
  pages: number;
  counts: Record<string, number>;
};

export type AdminResult =
  | { state: "ok"; data: AdminMessageList }
  | { state: "unauthorized" }
  | { state: "forbidden" }
  | { state: "offline" };

export async function fetchMessages(params: {
  durum?: string;
  ara?: string;
  sayfa?: number;
}): Promise<AdminResult> {
  const base = process.env.API_INTERNAL_URL?.trim();
  if (!base) return { state: "offline" };

  const query = new URLSearchParams();
  if (params.durum) query.set("durum", params.durum);
  if (params.ara) query.set("ara", params.ara);
  if (params.sayfa && params.sayfa > 1) query.set("sayfa", String(params.sayfa));

  const store = await cookies();
  const header = store
    .getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");

  try {
    const response = await fetch(`${base}/admin/messages?${query.toString()}`, {
      headers: { cookie: header },
      cache: "no-store",
    });

    if (response.status === 401) return { state: "unauthorized" };
    if (response.status === 403) return { state: "forbidden" };
    if (!response.ok) return { state: "offline" };

    return { state: "ok", data: (await response.json()) as AdminMessageList };
  } catch (error) {
    console.error("[dafalabs] panel verisi alınamadı:", error);
    return { state: "offline" };
  }
}

export type AdminProject = {
  id: number;
  slug: string;
  title_tr: string;
  tagline_tr: string;
  title_en: string;
  tagline_en: string;
  url: string | null;
  image_url: string | null;
  tags: string[];
  sort_order: number;
  is_published: boolean;
};

export async function fetchProjects(): Promise<AdminProject[] | null> {
  const base = process.env.API_INTERNAL_URL?.trim();
  if (!base) return null;

  const store = await cookies();
  const header = store
    .getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");

  try {
    const response = await fetch(`${base}/admin/projects`, {
      headers: { cookie: header },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return (await response.json()) as AdminProject[];
  } catch (error) {
    console.error("[dafalabs] proje listesi alınamadı:", error);
    return null;
  }
}

export type AdminUser = {
  id: number;
  email: string;
  name: string;
  redirect_url: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
};

export type SettingItem = { key: string; value: string; source: "db" | "env" };

async function adminFetch<T>(path: string): Promise<T | null> {
  const base = process.env.API_INTERNAL_URL?.trim();
  if (!base) return null;

  const store = await cookies();
  const header = store
    .getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");

  try {
    const response = await fetch(`${base}${path}`, {
      headers: { cookie: header },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[dafalabs] ${path} alınamadı:`, error);
    return null;
  }
}

export function fetchUsers() {
  return adminFetch<AdminUser[]>("/admin/users");
}

export function fetchSettings() {
  return adminFetch<SettingItem[]>("/admin/settings");
}

export type AdminPost = {
  id: number;
  slug: string;
  title_tr: string;
  excerpt_tr: string;
  body_tr: string;
  title_en: string;
  excerpt_en: string;
  body_en: string;
  cover_image: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  locales: string[];
};

export function fetchPosts() {
  return adminFetch<AdminPost[]>("/admin/posts");
}
