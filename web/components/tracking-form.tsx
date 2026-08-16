"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { STATUS_STYLES, statusStyle } from "@/lib/status";

type Result = {
  tracking_code: string;
  status: string;
  created_at: string;
  answered_at: string | null;
};

type State = "idle" | "sending" | "found" | "notFound" | "rate" | "error";


export function TrackingForm() {
  const t = useTranslations("tracking");
  const locale = useLocale();
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const code = String(new FormData(form).get("code") ?? "").trim();

    if (!code) {
      form.reportValidity();
      return;
    }

    setState("sending");
    setResult(null);

    try {
      const response = await fetch(`/api/takip/${encodeURIComponent(code)}`);

      if (response.ok) {
        setResult((await response.json()) as Result);
        setState("found");
        return;
      }

      if (response.status === 404) setState("notFound");
      else if (response.status === 429) setState("rate");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  const message =
    state === "notFound"
      ? t("notFound")
      : state === "rate"
        ? t("rateLimit")
        : state === "error"
          ? t("error")
          : null;

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(value));

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <form onSubmit={onSubmit} className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-3">
          <label htmlFor="code" className="label text-bone">
            {t("code")}
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            maxLength={20}
            autoComplete="off"
            spellCheck={false}
            placeholder={t("codePlaceholder")}
            className="w-full border border-line bg-ink-deep px-4 py-3.5 font-mono uppercase text-bone placeholder:text-ash/60 placeholder:normal-case transition-colors hover:border-line-strong focus:border-brass focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={state === "sending"}
          className="group inline-flex items-center gap-3 bg-brass px-7 py-4 text-sm font-medium text-ink transition-colors hover:bg-bone disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "sending" ? t("sending") : t("submit")}
          <span className="transition-transform duration-500 group-hover:translate-x-1">
            →
          </span>
        </button>
      </form>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className="border border-red-500/40 bg-red-500/5 px-5 py-4 text-sm text-red-400"
        >
          {message}
        </p>
      )}

      {state === "found" && result && (
        <div role="status" aria-live="polite" className="border border-line bg-ink-raised">
          <div className="border-b border-line px-7 py-5">
            <p className="label">{t("resultTitle")}</p>
            <p className="mt-2 font-mono text-lg text-brass">{result.tracking_code}</p>
          </div>

          <dl className="grid gap-px bg-line sm:grid-cols-3">
            <div className="flex flex-col gap-2 bg-ink-raised px-7 py-5">
              <dt className="label">{t("statusLabel")}</dt>
              <dd>
                <span
                  className={`inline-flex items-center gap-2 border px-3 py-1 text-sm font-medium ${
                    statusStyle(result.status).tone
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {t(statusStyle(result.status).label as "statusReceived")}
                </span>
              </dd>
            </div>

            <div className="flex flex-col gap-1 bg-ink-raised px-7 py-5">
              <dt className="label">{t("createdLabel")}</dt>
              <dd className="text-sm">{formatDate(result.created_at)}</dd>
            </div>

            {result.answered_at && (
              <div className="flex flex-col gap-1 bg-ink-raised px-7 py-5">
                <dt className="label">{t("answeredLabel")}</dt>
                <dd className="text-sm">{formatDate(result.answered_at)}</dd>
              </div>
            )}
          </dl>

          {result.status in STATUS_STYLES && (
            <p className="border-t border-line px-7 py-5 text-sm text-ash">
              {t(statusStyle(result.status).note as "statusReceivedNote")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
