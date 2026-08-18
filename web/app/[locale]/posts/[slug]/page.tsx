import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Reveal, RevealText } from "@/components/motion-primitives";
import { PostBody } from "@/components/post-body";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPost } from "@/lib/api";
import { postAlternates } from "@/lib/seo";
import { ArticleSchema } from "@/components/structured-data";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(locale as Locale, slug);

  if (!post) return { robots: { index: false } };

  return {
    title: `${post.title} — dafalabs`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
    alternates: postAlternates(locale as Locale, slug, post.locales),
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("posts");
  const format = await getFormatter();
  const post = await getPost(locale as Locale, slug);

  if (!post) {
    return (
      <section className="flex min-h-svh flex-col justify-center py-40">
        <div className="container-page">
          <p className="label mb-6">{t("label")}</p>
          <h1 className="display-md max-w-[20ch]">{t("onlyInOther")}</h1>
          <Link
            href="/posts"
            className="group mt-10 inline-flex items-center gap-3 text-sm text-ash transition-colors hover:text-bone"
          >
            {t("goToList")}
            <span className="transition-transform duration-500 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <article className="pb-24 pt-36 md:pt-48">
      <ArticleSchema
        title={post.title}
        excerpt={post.excerpt}
        slug={slug}
        locale={locale}
        publishedAt={post.published_at}
        image={post.cover_image}
      />

      <div className="container-page">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-ash">
            {post.published_at && (
              <span>
                {format.dateTime(new Date(post.published_at), { dateStyle: "long" })}
              </span>
            )}
            <span className="opacity-40">·</span>
            <span>
              {post.reading_minutes} {t("readingTime")}
            </span>
          </div>
        </Reveal>

        <RevealText as="h1" className="display-md max-w-[22ch]">
          {post.title}
        </RevealText>

        {post.excerpt && (
          <Reveal delay={0.15}>
            <p className="mt-8 max-w-[58ch] text-lg leading-relaxed text-ash">
              {post.excerpt}
            </p>
          </Reveal>
        )}

        {post.cover_image && (
          <Reveal delay={0.2}>
            <img
              src={post.cover_image}
              alt=""
              className="mt-14 aspect-[21/9] w-full border border-line object-cover"
            />
          </Reveal>
        )}

        <Reveal delay={0.25}>
          <div className="mt-16">
            <PostBody>{post.body}</PostBody>
          </div>
        </Reveal>

        <div className="mt-20 border-t border-line pt-10">
          <Link
            href="/posts"
            className="group inline-flex items-center gap-3 text-sm text-ash transition-colors hover:text-bone"
          >
            <span className="transition-transform duration-500 group-hover:-translate-x-1">
              ←
            </span>
            {t("back")}
          </Link>
        </div>
      </div>
    </article>
  );
}
