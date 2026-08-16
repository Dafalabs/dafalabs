import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TrackingForm } from "@/components/tracking-form";
import { Reveal } from "@/components/motion-primitives";
import { PageHead } from "@/components/page-head";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tracking" });
  return { title: t("title"), description: t("description"), robots: { index: false } };
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("tracking");

  return (
    <>
      <PageHead label={t("label")} heading={t("heading")} lede={t("lede")} />

      <section className="py-20 md:py-28">
        <div className="container-page">
          <Reveal>
            <TrackingForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
