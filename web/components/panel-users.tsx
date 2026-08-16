"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Field, inputClass } from "@/components/ui/field";
import type { AdminUser } from "@/lib/admin";

type Draft = {
  id: number | null;
  email: string;
  name: string;
  redirect_url: string;
  is_admin: boolean;
  is_active: boolean;
  password: string;
};

const EMPTY: Draft = {
  id: null,
  email: "",
  name: "",
  redirect_url: "",
  is_admin: false,
  is_active: true,
  password: "",
};

export function PanelUsers({ users }: { users: AdminUser[] }) {
  const t = useTranslations("panel");
  const locale = useLocale();
  const router = useRouter();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : t("never");

  async function save() {
    if (!draft || saving) return;

    setSaving(true);
    setError(null);

    const creating = draft.id === null;
    const body = creating
      ? {
          email: draft.email.trim(),
          name: draft.name.trim(),
          redirect_url: draft.redirect_url.trim(),
          is_admin: draft.is_admin,
          is_active: draft.is_active,
          password: draft.password.trim() || null,
        }
      : {
          name: draft.name.trim(),
          redirect_url: draft.redirect_url.trim(),
          is_admin: draft.is_admin,
          is_active: draft.is_active,
        };

    try {
      const response = await fetch(
        creating ? "/api/admin/users" : `/api/admin/users/${draft.id}`,
        {
          method: creating ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        if (creating) {
          const data = (await response.json()) as { password: string };
          setSecret(data.password);
        }
        setDraft(null);
        router.refresh();
        return;
      }

      if (response.status === 409) {
        setError(creating ? t("emailTaken") : t("selfLocked"));
        return;
      }

      setError(t("saveError"));
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(user: AdminUser) {
    const response = await fetch(`/api/admin/users/${user.id}/password`, {
      method: "POST",
    });

    if (!response.ok) return;

    const data = (await response.json()) as { password: string };
    setSecret(data.password);
    router.refresh();
  }

  async function remove(user: AdminUser) {
    if (!window.confirm(t("confirmDeleteUser"))) return;

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });

    if (response.status === 409) {
      setError(t("selfLocked"));
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {secret && (
        <div className="border border-brass/50 bg-brass/5 p-6">
          <p className="label text-brass">{t("newPasswordTitle")}</p>
          <p className="mt-3 font-mono text-2xl text-bone">{secret}</p>
          <p className="mt-3 text-sm text-ash">{t("newPasswordNote")}</p>
          <button
            type="button"
            onClick={() => setSecret(null)}
            className="mt-5 border border-line px-4 py-2 text-sm text-ash transition-colors hover:border-line-strong hover:text-bone"
          >
            {t("close")}
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDraft({ ...EMPTY });
          }}
          className="bg-brass px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bone"
        >
          + {t("newUser")}
        </button>
      </div>

      {draft && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="flex flex-col gap-6 border border-line bg-ink-raised p-7"
        >
          <p className="label">{draft.id ? t("editUser") : t("newUser")}</p>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label={t("email")}>
              <input
                type="email"
                required
                disabled={draft.id !== null}
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className={`${inputClass} disabled:opacity-50`}
              />
            </Field>

            <Field label={t("name")}>
              <input
                required
                minLength={2}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label={t("redirectUrl")} hint={t("redirectHint")}>
              <input
                type="url"
                value={draft.redirect_url}
                onChange={(e) => setDraft({ ...draft, redirect_url: e.target.value })}
                className={inputClass}
              />
            </Field>

            {draft.id === null && (
              <Field label={t("passwordOptional")} hint={t("passwordHint")}>
                <input
                  type="text"
                  minLength={8}
                  value={draft.password}
                  onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                  className={inputClass}
                />
              </Field>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.is_admin}
                onChange={(e) => setDraft({ ...draft, is_admin: e.target.checked })}
                className="h-4 w-4 accent-brass"
              />
              {t("isAdmin")}
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                className="h-4 w-4 accent-brass"
              />
              {t("isActive")}
            </label>
          </div>

          {error && (
            <p className="border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-brass px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bone disabled:opacity-60"
            >
              {saving ? t("saving") : t("save")}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="border border-line px-6 py-2.5 text-sm text-ash transition-colors hover:border-line-strong hover:text-bone"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      <div className="border-t border-line">
        {users.length === 0 ? (
          <p className="py-16 text-center text-ash">{t("noUsers")}</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="grid gap-4 border-b border-line py-5 md:grid-cols-[1fr_9rem_11rem_auto] md:items-center md:gap-6"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-3">
                  <span className="truncate font-medium">{user.name}</span>
                  {!user.is_active && (
                    <span className="border border-line px-2 py-0.5 text-[0.65rem] uppercase tracking-widest text-ash">
                      {t("inactive")}
                    </span>
                  )}
                </span>
                <span className="block truncate text-sm text-ash">{user.email}</span>
              </span>

              <span
                className={`text-xs uppercase tracking-widest ${
                  user.is_admin ? "text-brass" : "text-ash"
                }`}
              >
                {user.is_admin ? t("roleAdmin") : t("roleClient")}
              </span>

              <span className="font-mono text-xs text-ash">
                {t("lastLogin")}: {formatDate(user.last_login_at)}
              </span>

              <span className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setDraft({
                      id: user.id,
                      email: user.email,
                      name: user.name,
                      redirect_url: user.redirect_url,
                      is_admin: user.is_admin,
                      is_active: user.is_active,
                      password: "",
                    });
                  }}
                  className="border border-line px-3 py-1.5 text-xs text-ash transition-colors hover:border-line-strong hover:text-bone"
                >
                  {t("editUser")}
                </button>
                <button
                  type="button"
                  onClick={() => resetPassword(user)}
                  className="border border-line px-3 py-1.5 text-xs text-ash transition-colors hover:border-brass/50 hover:text-brass"
                >
                  {t("resetPassword")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(user)}
                  className="border border-line px-3 py-1.5 text-xs text-ash transition-colors hover:border-red-500/50 hover:text-red-400"
                >
                  {t("delete")}
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
