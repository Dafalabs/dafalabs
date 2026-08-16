"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Field, inputClassLarge } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";

type Status = "idle" | "sending" | "success" | "error" | "rate";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setStatus("sending");

    const payload = {
      ...Object.fromEntries(new FormData(form).entries()),
      locale,
    };

    try {
      const response = await fetch("/api/iletisim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as { tracking_code: string | null };
        form.reset();
        setTrackingCode(data.tracking_code);
        setStatus("success");
        return;
      }

      setStatus(response.status === 429 ? "rate" : "error");
    } catch {
      setStatus("error");
    }
  }

  const message =
    status === "success"
      ? t("success")
      : status === "error"
        ? t("error")
        : status === "rate"
          ? t("rateLimit")
          : null;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <Field label={t("name")} htmlFor="name">
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          className={inputClassLarge}
        />
      </Field>

      <Field label={t("email")} htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={160}
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          className={inputClassLarge}
        />
      </Field>

      <Field
        label={t("subject")}
        htmlFor="subject"
        hint={t("subjectOptional")}
      >
        <input
          id="subject"
          name="subject"
          type="text"
          maxLength={120}
          placeholder={t("subjectPlaceholder")}
          className={inputClassLarge}
        />
      </Field>

      <Field label={t("message")} htmlFor="message">
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          placeholder={t("messagePlaceholder")}
          className={`${inputClassLarge} resize-y leading-relaxed`}
        />
      </Field>

      <div className="absolute left-[-9999px] opacity-0" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`border px-5 py-4 text-sm ${
            status === "success"
              ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"
              : "border-red-500/40 bg-red-500/5 text-red-400"
          }`}
        >
          <p>{message}</p>

          {status === "success" && trackingCode && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-emerald-500/20 pt-4">
              <span className="label text-emerald-400/70">{t("trackingLabel")}</span>
              <span className="font-mono text-base text-bone">{trackingCode}</span>
              <Link
                href="/tracking"
                className="group inline-flex items-center gap-2 text-ash transition-colors hover:text-bone"
              >
                {t("trackLink")}
                <span className="transition-transform duration-500 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          )}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex items-center gap-3 bg-brass px-7 py-4 text-sm font-medium text-ink transition-colors hover:bg-bone disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? t("sending") : t("submit")}
          <span className="transition-transform duration-500 group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>
    </form>
  );
}
