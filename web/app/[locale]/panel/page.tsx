import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PanelMessage } from "@/components/panel-message";
import { PanelPosts } from "@/components/panel-posts";
import { PanelProjects } from "@/components/panel-projects";
import { PanelSettings } from "@/components/panel-settings";
import { PanelUsers } from "@/components/panel-users";
import { PanelTabs } from "@/components/panel-tabs";
import { PanelToolbar } from "@/components/panel-toolbar";
import { Link, redirect } from "@/i18n/navigation";
import {
  fetchMessages,
  fetchPosts,
  fetchProjects,
  fetchSettings,
  fetchUsers,
} from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "panel" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function PanelPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ durum?: string; ara?: string; sayfa?: string; sekme?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const query = await searchParams;
  const tab = query.sekme ?? "mesajlar";
  const projectsTab = tab === "projeler";
  const postsTab = tab === "yazilar";
  const usersTab = tab === "hesaplar";
  const settingsTab = tab === "ayarlar";
  const sayfa = Number(query.sayfa ?? "1") || 1;

  const result = await fetchMessages({
    durum: query.durum,
    ara: query.ara,
    sayfa,
  });

  const t = await getTranslations("panel");

  if (result.state !== "ok") {
    if (result.state === "offline") {
      return (
        <section className="flex min-h-svh items-center justify-center">
          <p className="text-ash">—</p>
        </section>
      );
    }

    redirect({ href: "/login", locale });
    return null;
  }

  const { data } = result;
  const filtered = Boolean(query.durum || query.ara);
  const projects = projectsTab ? await fetchProjects() : null;
  const posts = postsTab ? await fetchPosts() : null;
  const users = usersTab ? await fetchUsers() : null;
  const settings = settingsTab ? await fetchSettings() : null;

  return (
    <section className="pb-24 pt-36 md:pt-44">
      <div className="container-page flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label">
              {projectsTab
                ? t("headingProjects")
                : postsTab
                  ? t("headingPosts")
                  : usersTab
                  ? t("headingUsers")
                  : settingsTab
                    ? t("headingSettings")
                    : t("heading")}
            </p>
            <p className="mt-3 font-display text-3xl tracking-tight">
              {projectsTab ? (
                <>
                  {projects?.length ?? 0}{" "}
                  <span className="text-ash">{t("projectCount")}</span>
                </>
              ) : postsTab ? (
                <>
                  {posts?.length ?? 0}{" "}
                  <span className="text-ash">{t("postCount")}</span>
                </>
              ) : usersTab ? (
                <>
                  {users?.length ?? 0}{" "}
                  <span className="text-ash">{t("userCount")}</span>
                </>
              ) : settingsTab ? (
                <span className="text-ash">{t("headingSettings")}</span>
              ) : (
                <>
                  {data.total} <span className="text-ash">{t("total")}</span>
                </>
              )}
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="border border-line px-4 py-2 text-sm text-ash transition-colors hover:border-line-strong hover:text-bone"
            >
              {t("logout")}
            </button>
          </form>
        </div>

        <PanelTabs
          active={
            projectsTab
              ? "projeler"
              : postsTab
                ? "yazilar"
                : usersTab
                ? "hesaplar"
                : settingsTab
                  ? "ayarlar"
                  : "mesajlar"
          }
        />

        {projectsTab ? (
          <PanelProjects projects={projects ?? []} />
        ) : postsTab ? (
          <PanelPosts posts={posts ?? []} />
        ) : usersTab ? (
          <PanelUsers users={users ?? []} />
        ) : settingsTab ? (
          <PanelSettings settings={settings ?? []} />
        ) : (
          <>
            <PanelToolbar counts={data.counts} total={data.total} />

            <div className="border-t border-line">
              {data.items.length === 0 ? (
                <p className="py-16 text-center text-ash">
                  {filtered ? t("empty") : t("emptyAll")}
                </p>
              ) : (
                data.items.map((message) => (
                  <PanelMessage key={message.id} message={message} />
                ))
              )}
            </div>
          </>
        )}

        {tab === "mesajlar" && data.pages > 1 && (
          <div className="flex items-center justify-between gap-4 text-sm">
            {sayfa > 1 ? (
              <Link
                href={{
                  pathname: "/panel",
                  query: { ...query, sayfa: String(sayfa - 1) },
                }}
                className="text-ash transition-colors hover:text-bone"
              >
                ← {t("prev")}
              </Link>
            ) : (
              <span />
            )}

            <span className="font-mono text-xs text-ash">
              {t("page")} {data.page} / {data.pages}
            </span>

            {sayfa < data.pages ? (
              <Link
                href={{
                  pathname: "/panel",
                  query: { ...query, sayfa: String(sayfa + 1) },
                }}
                className="text-ash transition-colors hover:text-bone"
              >
                {t("next")} →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
