"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "mesajlar" | "projeler" | "yazilar" | "hesaplar" | "ayarlar";

export function PanelTabs({ active }: { active: Tab }) {
  const t = useTranslations("panel");
  const router = useRouter();
  const params = useSearchParams();

  function go(tab: Tab) {
    const next = new URLSearchParams(params.toString());
    next.delete("sayfa");
    next.delete("durum");
    next.delete("ara");

    if (tab === "mesajlar") next.delete("sekme");
    else next.set("sekme", tab);

    const query = next.toString();
    router.push(query ? `?${query}` : "?");
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "mesajlar", label: t("tabMessages") },
    { key: "projeler", label: t("tabProjects") },
    { key: "yazilar", label: t("tabPosts") },
    { key: "hesaplar", label: t("tabUsers") },
    { key: "ayarlar", label: t("tabSettings") },
  ];

  return (
    <div className="flex gap-8 border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => go(tab.key)}
          className={`relative pb-4 text-sm transition-colors ${
            active === tab.key ? "text-bone" : "text-ash hover:text-bone"
          }`}
        >
          {tab.label}
          {active === tab.key && (
            <span className="absolute inset-x-0 -bottom-px h-px bg-brass" />
          )}
        </button>
      ))}
    </div>
  );
}
