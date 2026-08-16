"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminMessage } from "@/lib/admin";
import { MESSAGE_STATUSES, statusStyle } from "@/lib/status";


export function PanelMessage({ message }: { message: AdminMessage }) {
  const t = useTranslations("panel");
  const tracking = useTranslations("tracking");
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(message.status);
  const [saving, setSaving] = useState(false);

  const label = (value: string) =>
    tracking(statusStyle(value).label as "statusReceived");

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  async function change(next: string) {
    if (next === status || saving) return;

    setSaving(true);
    const previous = status;
    setStatus(next);

    try {
      const response = await fetch(`/api/admin/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!response.ok) {
        setStatus(previous);
        return;
      }

      router.refresh();
    } catch {
      setStatus(previous);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="grid w-full gap-3 py-6 text-left transition-colors hover:bg-ink-raised md:grid-cols-[10rem_1fr_11rem] md:items-center md:gap-6"
      >
        <span className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 border px-2.5 py-1 text-xs font-medium ${
              statusStyle(status).tone
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {label(status)}
          </span>
        </span>

        <span className="min-w-0">
          <span className="block truncate font-medium">
            {message.subject || t("noSubject")}
          </span>
          <span className="block truncate text-sm text-ash">
            {message.name} · {message.email}
          </span>
        </span>

        <span className="flex items-center justify-between gap-3 md:justify-end">
          <span className="font-mono text-xs text-ash">
            {formatDate(message.created_at)}
          </span>
          <span
            className={`text-ash transition-transform duration-300 ${open ? "rotate-90" : ""}`}
            aria-hidden
          >
            ›
          </span>
        </span>
      </button>

      {open && (
        <div className="grid gap-8 pb-8 md:grid-cols-[1fr_16rem]">
          <div className="flex flex-col gap-4">
            <p className="whitespace-pre-wrap border-l-2 border-line pl-5 leading-relaxed text-ash">
              {message.message}
            </p>

            {message.mail_error && (
              <p className="border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {t("mailError")}: {message.mail_error}
              </p>
            )}

            <a
              href={`mailto:${message.email}?subject=${encodeURIComponent(
                `Re: ${message.subject || "dafalabs"} [${message.tracking_code}]`,
              )}`}
              className="group inline-flex w-fit items-center gap-2 text-sm text-brass transition-colors hover:text-bone"
            >
              {t("replyLink")}
              <span className="transition-transform duration-500 group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>

          <aside className="flex flex-col gap-5 border border-line bg-ink-raised p-5">
            <div className="flex flex-col gap-1">
              <span className="label">{t("code")}</span>
              <span className="font-mono text-sm text-brass">
                {message.tracking_code}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="label">{t("changeStatus")}</span>
              <div className="flex flex-wrap gap-2">
                {MESSAGE_STATUSES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={saving}
                    onClick={() => change(value)}
                    className={`border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                      status === value
                        ? statusStyle(value).tone
                        : "border-line text-ash hover:border-line-strong hover:text-bone"
                    }`}
                  >
                    {label(value)}
                  </button>
                ))}
              </div>
              {saving && <span className="text-xs text-ash">{t("saving")}</span>}
            </div>
          </aside>
        </div>
      )}
    </article>
  );
}
