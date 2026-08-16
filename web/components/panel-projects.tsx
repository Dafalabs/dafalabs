"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Field, inputClass } from "@/components/ui/field";
import type { AdminProject } from "@/lib/admin";

type Draft = Omit<AdminProject, "id"> & { id: number | null };

const EMPTY: Draft = {
  id: null,
  slug: "",
  title_tr: "",
  tagline_tr: "",
  title_en: "",
  tagline_en: "",
  url: "",
  image_url: "",
  tags: [],
  sort_order: 0,
  is_published: true,
};

export function PanelProjects({ projects }: { projects: AdminProject[] }) {
  const t = useTranslations("panel");
  const router = useRouter();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function edit(project: AdminProject) {
    setError(null);
    setDraft({ ...project, url: project.url ?? "", image_url: project.image_url ?? "" });
  }

  function create() {
    setError(null);
    setDraft({ ...EMPTY, sort_order: projects.length + 1 });
  }

  async function save() {
    if (!draft || saving) return;

    setSaving(true);
    setError(null);

    const body = {
      slug: draft.slug.trim(),
      title_tr: draft.title_tr.trim(),
      tagline_tr: draft.tagline_tr.trim(),
      title_en: draft.title_en.trim(),
      tagline_en: draft.tagline_en.trim(),
      url: draft.url?.trim() || null,
      image_url: draft.image_url?.trim() || null,
      tags: draft.tags,
      sort_order: draft.sort_order,
      is_published: draft.is_published,
    };

    try {
      const response = await fetch(
        draft.id ? `/api/admin/projects/${draft.id}` : "/api/admin/projects",
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

  async function remove(project: AdminProject) {
    if (!window.confirm(t("confirmDelete"))) return;

    await fetch(`/api/admin/projects/${project.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function upload(file: File) {
    if (!draft) return;

    setUploading(true);
    setError(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body });

      if (!response.ok) {
        setError(t("uploadError"));
        return;
      }

      const data = (await response.json()) as { image_url: string };
      setDraft({ ...draft, image_url: data.image_url });
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
          onClick={create}
          className="bg-brass px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bone"
        >
          + {t("newProject")}
        </button>
      </div>

      {draft && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="flex flex-col gap-6 border border-line bg-ink-raised p-7"
        >
          <p className="label">{draft.id ? t("editProject") : t("newProject")}</p>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label={t("slug")} hint={t("slugHint")}>
              <input
                required
                pattern="[a-z0-9-]+"
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label={t("order")}>
              <input
                type="number"
                value={draft.sort_order}
                onChange={(e) =>
                  setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })
                }
                className={inputClass}
              />
            </Field>

            <Field label={t("titleTr")}>
              <input
                required
                value={draft.title_tr}
                onChange={(e) => setDraft({ ...draft, title_tr: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label={t("titleEn")}>
              <input
                required
                value={draft.title_en}
                onChange={(e) => setDraft({ ...draft, title_en: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label={t("taglineTr")}>
              <textarea
                required
                rows={3}
                value={draft.tagline_tr}
                onChange={(e) => setDraft({ ...draft, tagline_tr: e.target.value })}
                className={`${inputClass} resize-y`}
              />
            </Field>

            <Field label={t("taglineEn")}>
              <textarea
                required
                rows={3}
                value={draft.tagline_en}
                onChange={(e) => setDraft({ ...draft, tagline_en: e.target.value })}
                className={`${inputClass} resize-y`}
              />
            </Field>

            <Field label={t("projectUrl")} hint={t("projectUrlHint")}>
              <input
                type="url"
                value={draft.url ?? ""}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
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

          <Field label={t("image")} hint={t("imageHint")}>
            <div className="flex flex-wrap items-center gap-4">
              {draft.image_url ? (
                <span className="flex items-center gap-3">
                  <img
                    src={draft.image_url}
                    alt=""
                    className="h-16 w-24 border border-line object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, image_url: "" })}
                    className="text-xs text-ash underline-offset-4 hover:text-bone hover:underline"
                  >
                    {t("removeImage")}
                  </button>
                </span>
              ) : null}

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
        {projects.length === 0 ? (
          <p className="py-16 text-center text-ash">{t("noProjects")}</p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="grid gap-4 border-b border-line py-5 md:grid-cols-[4rem_7rem_1fr_auto] md:items-center md:gap-6"
            >
              <span className="font-mono text-xs text-ash">
                {String(project.sort_order).padStart(2, "0")}
              </span>

              <span className="h-14 w-20 overflow-hidden border border-line bg-ink-deep">
                {project.image_url && (
                  <img
                    src={project.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-3">
                  <span className="truncate font-medium">{project.title_tr}</span>
                  {!project.is_published && (
                    <span className="border border-line px-2 py-0.5 text-[0.65rem] uppercase tracking-widest text-ash">
                      {t("draft")}
                    </span>
                  )}
                </span>
                <span className="block truncate text-sm text-ash">
                  {project.url || "—"}
                </span>
              </span>

              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => edit(project)}
                  className="border border-line px-3 py-1.5 text-xs text-ash transition-colors hover:border-line-strong hover:text-bone"
                >
                  {t("editProject")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(project)}
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
