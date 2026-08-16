"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { MESSAGE_STATUSES, statusStyle } from "@/lib/status";
import { useState } from "react";


export function PanelToolbar({
  counts,
  total,
}: {
  counts: Record<string, number>;
  total: number;
}) {
  const t = useTranslations("panel");
  const tracking = useTranslations("tracking");
  const router = useRouter();
  const params = useSearchParams();

  const active = params.get("durum") ?? "";
  const [term, setTerm] = useState(params.get("ara") ?? "");

  const label = (value: string) =>
    tracking(statusStyle(value).label as "statusReceived");

  function go(next: URLSearchParams) {
    next.delete("sayfa");
    const query = next.toString();
    router.push(query ? `?${query}` : "?");
  }

  function filter(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("durum", value);
    else next.delete("durum");
    go(next);
  }

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (term.trim()) next.set("ara", term.trim());
    else next.delete("ara");
    go(next);
  }

  const totals: Record<string, number> = { "": total, ...counts };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2">
        {["", ...MESSAGE_STATUSES].map((value) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => filter(value)}
            className={`border px-3 py-1.5 text-xs transition-colors ${
              active === value
                ? "border-brass text-brass"
                : "border-line text-ash hover:border-line-strong hover:text-bone"
            }`}
          >
            {value ? label(value) : t("all")}
            <span className="ml-2 font-mono opacity-60">{totals[value] ?? 0}</span>
          </button>
        ))}
      </div>

      <form onSubmit={search} className="flex items-center gap-2">
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-64 border border-line bg-ink-deep px-3 py-2 text-sm text-bone placeholder:text-ash/60 focus:border-brass focus:outline-none"
        />
        <button
          type="submit"
          className="border border-line px-3 py-2 text-sm text-ash transition-colors hover:border-line-strong hover:text-bone"
        >
          {t("search")}
        </button>
      </form>
    </div>
  );
}
