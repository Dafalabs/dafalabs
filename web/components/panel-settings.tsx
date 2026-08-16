"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { SettingItem } from "@/lib/admin";

const LABELS: Record<string, string> = {
  email: "settingEmail",
  phone: "settingPhone",
  location: "settingLocation",
  social_github: "settingGithub",
  social_linkedin: "settingLinkedin",
  social_instagram: "settingInstagram",
  social_x: "settingX",
};

export function PanelSettings({ settings }: { settings: SettingItem[] }) {
  const t = useTranslations("panel");
  const router = useRouter();

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((item) => [item.key, item.value])),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });

      if (response.ok) {
        setSaved(true);
        router.refresh();
        return;
      }

      setError(t("saveError"));
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex max-w-3xl flex-col gap-8">
      <p className="text-sm text-ash">{t("settingsHint")}</p>

      <div className="grid gap-6 md:grid-cols-2">
        {settings.map((item) => (
          <div key={item.key} className="flex flex-col gap-2">
            <span className="label text-bone">
              {t(LABELS[item.key] as "settingEmail")}
              <span className="ml-2 normal-case tracking-normal text-ash">
                {item.source === "db" ? t("sourceDb") : t("sourceEnv")}
              </span>
            </span>
            <input
              value={values[item.key] ?? ""}
              onChange={(e) =>
                setValues({ ...values, [item.key]: e.target.value })
              }
              className="w-full border border-line bg-ink-deep px-3 py-2.5 text-sm text-bone focus:border-brass focus:outline-none"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {saved && (
        <p className="border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
          {t("settingsSaved")}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={saving}
          className="bg-brass px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bone disabled:opacity-60"
        >
          {saving ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
