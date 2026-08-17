import { getFormatter, getTranslations } from "next-intl/server";

import { Reveal, RevealLine, RevealText } from "@/components/motion-primitives";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPosts } from "@/lib/api";

const LIMIT = 5;

export async function HomePosts({ locale }: { locale: Locale }) {
  const posts = (await getPosts(locale)).slice(0, LIMIT);

  if (posts.length === 0) return null;

  const t = await getTranslations("posts");
  const format = await getFormatter();

  return (
    <section className="py-28 md:py-40">
      <div className="container-page">
        <RevealLine className="mb-16" />

        <div className="grid gap-12 md:grid-cols-[16rem_1fr]">
          <Reveal>
            <p className="label">{t("label")}</p>
          </Reveal>
          <RevealText as="h2" className="display-md max-w-2xl">
            {t("heading")}
          </RevealText>
        </div>

        <div className="mt-20 border-t border-line">
          {posts.map((post) => (
            <Reveal key={post.slug}>
              <Link
                href={{ pathname: "/posts/[slug]", params: { slug: post.slug } }}
                className="group grid gap-3 border-b border-line py-8 md:grid-cols-[9rem_1fr_auto] md:items-baseline md:gap-10"
              >
                <span className="font-mono text-xs text-ash">
                  {post.published_at &&
                    format.dateTime(new Date(post.published_at), {
                      dateStyle: "medium",
                    })}
                </span>

                <span className="font-display text-xl tracking-tight transition-colors group-hover:text-brass md:text-2xl">
                  {post.title}
                </span>

                <span className="font-mono text-xs text-ash">
                  {post.reading_minutes} {t("readingTime")}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14">
          <Link
            href="/posts"
            className="group inline-flex items-center gap-3 text-sm text-ash transition-colors hover:text-bone"
          >
            {t("all")}
            <span className="transition-transform duration-500 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
