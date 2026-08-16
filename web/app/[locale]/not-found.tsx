import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <section className="flex min-h-svh flex-col justify-center py-40">
      <div className="container-page">
        <p className="label mb-8">404</p>
        <h1 className="display-lg max-w-[14ch]">{t("title")}</h1>
        <p className="mt-8 max-w-[46ch] text-lg text-ash">{t("body")}</p>
        <Link
          href="/"
          className="group mt-12 inline-flex items-center gap-3 bg-brass px-7 py-4 text-sm font-medium text-ink transition-colors hover:bg-bone"
        >
          {t("home")}
          <span className="transition-transform duration-500 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
