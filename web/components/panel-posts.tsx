"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Field, inputClass } from "@/components/ui/field";
import type { AdminPost } from "@/lib/admin";

type Draft = Omit<AdminPost, "id" | "published_at" | "locales"> & {
  id: number | null;
};

const EMPTY: Draft = {
  slug: "",
  title_tr: "",
  excerpt_tr: "",
  body_tr: "",
  title_en: "",
  excerpt_en: "",
  body_en: "",
  cover_image: "",
  tags: [],
  is_published: false,
  id: null,
};

export function PanelPosts({ posts }: { posts: AdminPost[] }) {
  const t = useTranslations("panel");
  const locale = useLocale();
  const router = useRouter();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
          dateStyle: "medium",
        }).format(new Date(value))
      : "—";

  const languageLabel = (locales: string[]) => {
    if (locales.length === 2) return t("bothLangs");
    if (locales[0] === "tr") return t("onlyTr");
    if (locales[0] === "en") return t("onlyEn");
    return t("noLang");
  };

  async function save() {
    if (!draft || saving) return;

    setSaving(true);
    setError(null);

    const body = {
      slug: draft.slug.trim(),
      title_tr: draft.title_tr.trim(),
      excerpt_tr: draft.excerpt_tr.trim(),
      body_tr: draft.body_tr,
      title_en: draft.title_en.trim(),
      excerpt_en: draft.excerpt_en.trim(),
      body_en: draft.body_en,
      cover_image: draft.cover_image?.trim() || null,
      tags: draft.tags,
      is_published: draft.is_published,
    };

    try {
      const response = await fetch(
        draft.id ? `/api/admin/posts/${draft.id}` : "/api/admin/posts",
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        setDraft(null);
        router.refresh();
        return;
      }

      setError(response.status === 409 ? t("slugTaken") : t("saveError"));
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(post: AdminPost) {
    if (!window.confirm(t("confirmDeletePost"))) return;

    await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function upload(file: File) {
    if (!draft) return;

    setUploading(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body });

      if (!response.ok) {
        setError(t("uploadError"));
        return;
      }

      const data = (await response.json()) as { image_url: string };
      setDraft({ ...draft, cover_image: data.image_url });
    } catch {
      setError(t("uploadError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDraft({ ...EMPTY });
          }}
          className="bg-brass px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bone"
        >
          + {t("newPost")}
        </button>
      </div>

      {draft && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="flex flex-col gap-7 border border-line bg-ink-raised p-7"
        >
          <p className="label">{draft.id ? t("editPost") : t("newPost")}</p>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label={t("postSlug")} hint={t("postSlugHint")}>
              <input
                required
                pattern="[a-z0-9-]+"
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label={t("tags")} hint={t("tagsHint")}>
              <input
                value={draft.tags.join(", ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    tags: e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  })
                }
                className={inputClass}
              />
            </Field>
          </div>

          <p className="border-l-2 border-brass/40 pl-4 text-sm text-ash">
            {t("langHint")}
          </p>

          <div className="grid gap-8 lg:grid-cols-2">
            <LanguageBlock
              heading={t("postTr")}
              title={draft.title_tr}
              excerpt={draft.excerpt_tr}
              body={draft.body_tr}
              labels={{
                title: t("postTitle"),
                excerpt: t("postExcerpt"),
                body: t("postBody"),
              }}
              onChange={(field, value) =>
                setDraft({ ...draft, [`${field}_tr`]: value })
              }
            />

            <LanguageBlock
              heading={t("postEn")}
              title={draft.title_en}
              excerpt={draft.excerpt_en}
              body={draft.body_en}
              labels={{
                title: t("postTitle"),
                excerpt: t("postExcerpt"),
                body: t("postBody"),
              }}
              onChange={(field, value) =>
                setDraft({ ...draft, [`${field}_en`]: value })
              }
            />
          </div>

          <Field label={t("cover")} hint={t("imageHint")}>
            <div className="flex flex-wrap items-center gap-4">
              {draft.cover_image && (
                <span className="flex items-center gap-3">
                  <img
                    src={draft.cover_image}
                    alt=""
                    className="h-16 w-24 border border-line object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, cover_image: "" })}
                    className="text-xs text-ash underline-offset-4 hover:text-bone hover:underline"
                  >
                    {t("removeImage")}
                  </button>
                </span>
              )}

              <label className="cursor-pointer border border-line px-4 py-2 text-sm text-ash transition-colors hover:border-line-strong hover:text-bone">
                {uploading ? t("uploading") : t("upload")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                  }}
                />
              </label>
            </div>
          </Field>

          <label className="flex w-fit items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={draft.is_published}
              onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })}
              className="h-4 w-4 accent-brass"
            />
            {t("published")}
          </label>

          {error && (
            <p className="border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-brass px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bone disabled:opacity-60"
            >
              {saving ? t("saving") : t("save")}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="border border-line px-6 py-2.5 text-sm text-ash transition-colors hover:border-line-strong hover:text-bone"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      <div className="border-t border-line">
        {posts.length === 0 ? (
          <p className="py-16 text-center text-ash">{t("noPosts")}</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="grid gap-4 border-b border-line py-5 md:grid-cols-[1fr_8rem_8rem_auto] md:items-center md:gap-6"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-3">
                  <span className="truncate font-medium">
                    {post.title_tr || post.title_en || post.slug}
                  </span>
                  {!post.is_published && (
                    <span className="border border-line px-2 py-0.5 text-[0.65rem] uppercase tracking-widest text-ash">
                      {t("draft")}
                    </span>
                  )}
                </span>
                <span className="block truncate font-mono text-xs text-ash">
                  {post.slug}
                </span>
              </span>

              <span className="font-mono text-xs text-ash">
                {languageLabel(post.locales)}
              </span>

              <span className="font-mono text-xs text-ash">
                {formatDate(post.published_at)}
              </span>

              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setDraft({
                      ...post,
                      cover_image: post.cover_image ?? "",
                    });
                  }}
                  className="border border-line px-3 py-1.5 text-xs text-ash transition-colors hover:border-line-strong hover:text-bone"
                >
                  {t("editPost")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(post)}
                  className="border border-line px-3 py-1.5 text-xs text-ash transition-colors hover:border-red-500/50 hover:text-red-400"
                >
                  {t("delete")}
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


function LanguageBlock({
  heading,
  title,
  excerpt,
  body,
  labels,
  onChange,
}: {
  heading: string;
  title: string;
  excerpt: string;
  body: string;
  labels: { title: string; excerpt: string; body: string };
  onChange: (field: "title" | "excerpt" | "body", value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 border border-line p-5">
      <p className="label text-brass">{heading}</p>

      <Field label={labels.title}>
        <input
          value={title}
          onChange={(e) => onChange("title", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label={labels.excerpt}>
        <textarea
          rows={2}
          value={excerpt}
          onChange={(e) => onChange("excerpt", e.target.value)}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <Field label={labels.body}>
        <textarea
          rows={14}
          value={body}
          onChange={(e) => onChange("body", e.target.value)}
          className={`${inputClass} resize-y font-mono leading-relaxed`}
        />
      </Field>
    </div>
  );
}
