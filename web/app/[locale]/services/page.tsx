import type { Metadata } from "next";

import type { Locale } from "@/i18n/routing";
import { pageAlternates } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CtaBand } from "@/components/cta-band";
import { PageHead } from "@/components/page-head";
import { ProcessSteps } from "@/components/process-steps";
import { ServiceList } from "@/components/service-list";
import { RevealLine, RevealText, Reveal } from "@/components/motion-primitives";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale as Locale, "/services"),
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("services");
  const home = await getTranslations("home");

  return (
    <>
      <PageHead label={t("label")} heading={t("heading")} lede={t("lede")} />

      <section className="py-24 md:py-32">
        <div className="container-page">
          <ServiceList variant="long" />
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="container-page">
          <RevealLine className="mb-16" />
          <div className="grid gap-12 md:grid-cols-[16rem_1fr]">
            <Reveal>
              <p className="label">{home("howWeWork.label")}</p>
            </Reveal>
            <RevealText as="h2" className="display-md max-w-2xl">
              {home("howWeWork.title")}
            </RevealText>
          </div>
          <div className="mt-20">
            <ProcessSteps />
          </div>
        </div>
      </section>

      <CtaBand
        title={t("cta.title")}
        body={t("cta.body")}
        button={home("cta.button")}
      />
    </>
  );
}
