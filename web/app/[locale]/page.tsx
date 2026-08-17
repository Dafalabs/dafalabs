import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { pageAlternates } from "@/lib/seo";
import { CtaBand } from "@/components/cta-band";
import { Hero } from "@/components/hero";
import { HomePosts } from "@/components/home-posts";
import { Marquee } from "@/components/marquee";
import { getSiteContent } from "@/lib/api";
import { Reveal, RevealLine, RevealText } from "@/components/motion-primitives";
import { ProcessSteps } from "@/components/process-steps";
import { ServiceList } from "@/components/service-list";
import { Link } from "@/i18n/navigation";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: pageAlternates(locale as Locale, "/") };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const services = await getTranslations("services.items");
  const { projects } = await getSiteContent();

  const marquee = ["mobile", "web", "design", "consulting"].map((key) =>
    services(`${key}.name` as "mobile.name"),
  );

  return (
    <>
      <Hero
        line1={t("hero.line1")}
        rotating={t.raw("hero.rotating") as string[]}
        lede={t("hero.lede")}
        cta={t("hero.cta")}
        secondary={projects.length > 0 ? t("hero.secondary") : null}
        scroll={t("hero.scroll")}
      />

      <Marquee items={marquee} />

      <section className="py-28 md:py-40">
        <div className="container-page">
          <RevealLine className="mb-16" />

          <ServiceList variant="short" />

          <Reveal className="mt-14">
            <Link
              href="/services"
              className="group inline-flex items-center gap-3 text-sm text-ash transition-colors hover:text-bone"
            >
              {t("whatWeDo.all")}
              <span className="transition-transform duration-500 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
      <section className="py-28 md:py-40">
        <div className="container-page">
          <RevealLine className="mb-16" />

          <div className="grid gap-12 md:grid-cols-[16rem_1fr]">
            <Reveal>
              <p className="label">{t("howWeWork.label")}</p>
            </Reveal>
            <RevealText as="h2" className="display-md max-w-2xl">
              {t("howWeWork.title")}
            </RevealText>
          </div>

          <div className="mt-20">
            <ProcessSteps />
          </div>
        </div>
      </section>

      <HomePosts locale={locale as Locale} />

      <CtaBand
        label={t("cta.label")}
        title={t("cta.title")}
        body={t("cta.body")}
        button={t("cta.button")}
      />
    </>
  );
}
