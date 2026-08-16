"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error("[dafalabs] sayfa hatası:", error);
  }, [error]);

  return (
    <section className="flex min-h-svh flex-col justify-center py-40">
      <div className="container-page">
        <p className="label mb-8">{t("label")}</p>
        <h1 className="display-lg max-w-[16ch]">{t("heading")}</h1>
        <p className="mt-8 max-w-[46ch] text-lg text-ash">{t("body")}</p>

        <button
          type="button"
          onClick={reset}
          className="group mt-12 inline-flex items-center gap-3 bg-brass px-7 py-4 text-sm font-medium text-ink transition-colors hover:bg-bone"
        >
          {t("retry")}
          <span className="transition-transform duration-500 group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>
    </section>
  );
}
