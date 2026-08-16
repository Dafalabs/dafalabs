import type { Metadata } from "next";

import type { Locale } from "@/i18n/routing";
import { pageAlternates } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/motion-primitives";
import { PageHead } from "@/components/page-head";
import { Link } from "@/i18n/navigation";
import { getSiteContent } from "@/lib/api";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale as Locale, "/contact"),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contact");
  const { contact } = await getSiteContent();

  return (
    <>
      <PageHead label={t("label")} heading={t("heading")} lede={t("lede")} />

      <section className="py-20 md:py-28">
        <div className="container-page">
          <div className="grid gap-16 lg:grid-cols-[1fr_20rem] lg:items-start">
            <div className="flex flex-col gap-10">
              <Reveal>
                <ContactForm />
              </Reveal>

              <Reveal delay={0.1}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-8 text-sm">
                  <span className="text-ash">{t("trackPrompt")}</span>
                  <Link
                    href="/tracking"
                    className="group inline-flex items-center gap-2 transition-colors hover:text-brass"
                  >
                    {t("trackCta")}
                    <span className="transition-transform duration-500 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.15}>
              <aside className="flex flex-col gap-8 border border-line bg-ink-raised p-8">
                <InfoItem label={t("info.email")}>
                  <a
                    href={`mailto:${contact.email}`}
                    className="transition-colors hover:text-brass"
                  >
                    {contact.email}
                  </a>
                </InfoItem>

                {contact.phone && (
                  <InfoItem label={t("info.phone")}>
                    <a
                      href={`tel:${contact.phone}`}
                      className="transition-colors hover:text-brass"
                    >
                      {contact.phone}
                    </a>
                  </InfoItem>
                )}

                {contact.location && (
                  <InfoItem label={t("info.location")}>{contact.location}</InfoItem>
                )}

                <InfoItem label={t("info.response")}>
                  {t("info.responseValue")}
                </InfoItem>

                {contact.socials.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-t border-line pt-6">
                    {contact.socials.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-line px-4 py-2 font-mono text-xs text-ash transition-colors hover:border-line-strong hover:text-bone"
                      >
                        {social.name}
                      </a>
                    ))}
                  </div>
                )}
              </aside>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label">{label}</span>
      <span>{children}</span>
    </div>
  );
}
