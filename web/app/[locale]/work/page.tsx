import type { Metadata } from "next";

import { pageAlternates } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CtaBand } from "@/components/cta-band";
import { PageHead } from "@/components/page-head";
import { ProjectImage } from "@/components/project-image";
import { Reveal } from "@/components/motion-primitives";
import type { Locale } from "@/i18n/routing";
import { notFound } from "next/navigation";

import { getProjects } from "@/lib/api";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "work" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale as Locale, "/work"),
  };
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("work");
  const home = await getTranslations("home");
  const { items } = await getProjects(locale as Locale);
  if (items.length === 0) notFound();

  return (
    <>
      <PageHead label={t("label")} heading={t("heading")} lede={t("lede")} />

      <section className="py-20 md:py-28">
        <div className="container-page">

          <div className="border-t border-line">
            {items.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.06}>
                <Row url={item.url ?? undefined}>
                  <span className="label transition-colors duration-500 group-hover:text-brass">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="aspect-[16/10] w-full overflow-hidden border border-line md:max-w-[20rem]">
                    <div className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105">
                      <ProjectImage src={item.image_url} alt={item.content.title} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h2 className="font-display text-2xl tracking-tight md:text-3xl">
                      {item.content.title}
                    </h2>
                    <p className="max-w-[52ch] text-ash">{item.content.tagline}</p>
                    {item.url && (
                      <span className="mt-2 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ash transition-colors group-hover:text-brass">
                        {t("view")}
                        <span className="transition-transform duration-500 group-hover:translate-x-1">
                          ↗
                        </span>
                      </span>
                    )}
                  </div>
                </Row>
              </Reveal>
            ))}
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

function Row({ url, children }: { url?: string; children: React.ReactNode }) {
  const className =
    "group grid gap-8 border-b border-line py-10 md:grid-cols-[5rem_20rem_1fr] md:items-center md:gap-10";

  if (!url) return <div className={className}>{children}</div>;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
