import type { Metadata } from "next";

import { pageAlternates } from "@/lib/seo";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Reveal } from "@/components/motion-primitives";
import { PageHead } from "@/components/page-head";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPosts } from "@/lib/api";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "posts" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale as Locale, "/posts"),
  };
}

export default async function PostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("posts");
  const format = await getFormatter();
  const posts = await getPosts(locale as Locale);

  return (
    <>
      <PageHead label={t("label")} heading={t("heading")} lede={t("lede")} />

      <section className="py-20 md:py-28">
        <div className="container-page">
          {posts.length === 0 ? (
            <p className="py-16 text-ash">{t("empty")}</p>
          ) : (
            <div className="border-t border-line">
              {posts.map((post, index) => (
                <Reveal key={post.slug} delay={index * 0.05}>
                  <Link
                    href={{ pathname: "/posts/[slug]", params: { slug: post.slug } }}
                    className="group grid gap-4 border-b border-line py-10 md:grid-cols-[11rem_1fr] md:gap-10"
                  >
                    <span className="flex flex-col gap-1 font-mono text-xs text-ash">
                      {post.published_at && (
                        <span>
                          {format.dateTime(new Date(post.published_at), {
                            dateStyle: "medium",
                          })}
                        </span>
                      )}
                      <span>
                        {post.reading_minutes} {t("readingTime")}
                      </span>
                    </span>

                    <span className="flex flex-col gap-3">
                      <h2 className="font-display text-2xl tracking-tight transition-colors group-hover:text-brass md:text-3xl">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="max-w-[62ch] text-ash">{post.excerpt}</p>
                      )}
                      {post.tags.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="border border-line px-2.5 py-0.5 font-mono text-xs text-ash"
                            >
                              {tag}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
