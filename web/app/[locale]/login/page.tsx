import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LoginForm } from "@/components/login-form";
import { Reveal } from "@/components/motion-primitives";
import { PageHead } from "@/components/page-head";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: t("title"), description: t("description"), robots: { index: false } };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("login");

  return (
    <>
      <PageHead label={t("label")} heading={t("heading")} lede={t("lede")} />

      <section className="py-20 md:py-28">
        <div className="container-page">
          <Reveal>
            <LoginForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
