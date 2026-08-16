"use client";

import { useLocale, useTranslations } from "next-intl";

import { inputClassLarge } from "@/components/ui/field";
import { useState } from "react";

type State = "idle" | "sending" | "error" | "rate" | "offline" | "success";

export function LoginForm() {
  const t = useTranslations("login");
  const locale = useLocale();
  const [state, setState] = useState<State>("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setState("sending");

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          redirect_url: string;
          is_admin: boolean;
        };
        setState("success");
        window.location.assign(
          data.is_admin ? `/${locale}/panel` : data.redirect_url,
        );
        return;
      }

      if (response.status === 429) setState("rate");
      else if (response.status === 401) setState("error");
      else setState("offline");
    } catch {
      setState("offline");
    }
  }

  const message =
    state === "error"
      ? t("error")
      : state === "rate"
        ? t("rateLimit")
        : state === "offline"
          ? t("offline")
          : state === "success"
            ? t("success")
            : null;

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-md flex-col gap-8">
      <div className="flex flex-col gap-3">
        <label htmlFor="email" className="label text-bone">
          {t("email")}
        </label>
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
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="password" className="label text-bone">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={200}
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          className={inputClassLarge}
        />
      </div>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className={`border px-5 py-4 text-sm ${
            state === "success"
              ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"
              : "border-red-500/40 bg-red-500/5 text-red-400"
          }`}
        >
          {message}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={state === "sending" || state === "success"}
          className="group inline-flex items-center gap-3 bg-brass px-7 py-4 text-sm font-medium text-ink transition-colors hover:bg-bone disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "sending" ? t("sending") : t("submit")}
          <span className="transition-transform duration-500 group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>
    </form>
  );
}
