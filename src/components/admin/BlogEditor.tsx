"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import type { BlogFormState, CoverUploadResult } from "@/app/actions/blog";
import { uploadBlogCoverAction } from "@/app/actions/blog";
import { Markdown } from "@/components/blog/Markdown";
import { blogCoverUrl } from "@/lib/artworkUrls";
import { AdminIcon, INPUT_CLASSES, LABEL_CLASSES, PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/admin/ui";

export type BlogEditorValues = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  coverImageAlt: string;
};

export const EMPTY_BLOG_VALUES: BlogEditorValues = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  coverImageAlt: "",
};

/** Client-side copy of slugify in src/lib/blog.ts, for the live link preview. */
function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

type Button = { intent: "save" | "submit" | "publish"; label: string; primary?: boolean };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-coral-signal">
      {message}
    </p>
  );
}

/**
 * Write and edit a blog post. Every field is controlled, so nothing typed is
 * lost if a save fails; the server re-checks everything (blogPostFormSchema).
 */
export function BlogEditor({
  action,
  defaults,
  buttons,
  slugLocked = false,
  siteUrl,
}: {
  action: (prev: BlogFormState, formData: FormData) => Promise<BlogFormState>;
  defaults: BlogEditorValues;
  /** Which save buttons this person gets for this post (worked out on the server). */
  buttons: Button[];
  /** True once the post has been live: its link can't change. */
  slugLocked?: boolean;
  /** e.g. "stickerquest.co.za", shown before the link. */
  siteUrl: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [values, setValues] = useState(defaults);
  const [slugTouched, setSlugTouched] = useState(slugLocked || defaults.slug !== "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [saved, setSaved] = useState(defaults);
  const errors = state?.fieldErrors ?? {};
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  // Where to put the selection after a toolbar edit, applied once React has re-rendered the text.
  const pendingSelection = useRef<[number, number] | null>(null);
  useLayoutEffect(() => {
    const sel = pendingSelection.current;
    const el = bodyRef.current;
    if (!sel || !el) return;
    pendingSelection.current = null;
    el.focus();
    el.setSelectionRange(sel[0], sel[1]);
  });

  const set = <K extends keyof BlogEditorValues>(key: K, value: BlogEditorValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const slug = slugTouched ? values.slug : slugify(values.title);

  // Remember the last saved version, and warn before leaving with unsaved changes.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.ok) setSaved(values);
  }
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** Wraps the selected text (or inserts a placeholder) in the body. */
  function format(kind: "bold" | "italic" | "link" | "h2" | "h3" | "ul" | "ol" | "quote") {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const text = values.body;
    const selected = text.slice(start, end);
    let insert: string;
    let caret: [number, number];

    if (kind === "bold" || kind === "italic") {
      const mark = kind === "bold" ? "**" : "_";
      const inner = selected || (kind === "bold" ? "bold text" : "italic text");
      insert = `${mark}${inner}${mark}`;
      caret = [start + mark.length, start + mark.length + inner.length];
    } else if (kind === "link") {
      const inner = selected || "link text";
      insert = `[${inner}](https://)`;
      caret = [start + inner.length + 3, start + inner.length + 11];
    } else {
      // Line formats apply to every selected line.
      const prefix = { h2: "## ", h3: "### ", ul: "- ", ol: "1. ", quote: "> " }[kind];
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const block = text.slice(lineStart, end) || "";
      const lines = (block || (kind.startsWith("h") ? "Heading" : "List item")).split("\n");
      const done = lines.map((line, i) => (kind === "ol" ? `${i + 1}. ` : prefix) + line.replace(/^(#{1,6} |[-*] |\d+\. |> )/, "")).join("\n");
      const next = text.slice(0, lineStart) + done + text.slice(end);
      pendingSelection.current = [lineStart, lineStart + done.length];
      set("body", next);
      return;
    }

    pendingSelection.current = caret;
    set("body", text.slice(0, start) + insert + text.slice(end));
  }

  const wordCount = values.body.split(/\s+/).filter(Boolean).length;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state?.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${state.ok ? "bg-trail-teal/10" : "bg-coral-signal/10"} text-admin-ink`}
        >
          {state.message}
        </p>
      )}

      <label className={LABEL_CLASSES}>
        Title
        <input
          name="title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={120}
          required
          placeholder="e.g. Holo vs chrome: which one pops more?"
          className={`${INPUT_CLASSES} h-12 text-lg font-semibold`}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        <FieldError id="title-error" message={errors.title} />
      </label>

      <label className={LABEL_CLASSES}>
        Link
        <span className="flex items-center overflow-hidden rounded-lg border border-admin-line bg-admin-canvas focus-within:border-grape focus-within:ring-2 focus-within:ring-grape/20">
          <span className="shrink-0 pl-3 text-sm font-normal text-admin-muted">{siteUrl}/blog/</span>
          <input
            name="slug"
            value={slug}
            readOnly={slugLocked}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
            }}
            maxLength={80}
            className="h-10 min-w-0 flex-1 bg-white px-1 text-sm text-admin-ink outline-none read-only:bg-admin-canvas read-only:text-admin-muted"
            aria-invalid={errors.slug ? true : undefined}
            aria-describedby={errors.slug ? "slug-error" : "slug-hint"}
          />
        </span>
        <p id="slug-hint" className="text-xs font-normal text-admin-faint">
          {slugLocked ? "This post has been live, so its link stays the same." : "Made from the title. You can change it until the post goes live."}
        </p>
        <FieldError id="slug-error" message={errors.slug} />
      </label>

      <label className={LABEL_CLASSES}>
        Summary
        <textarea
          name="excerpt"
          value={values.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="One or two sentences shown on the blog list and when the post is shared."
          className={`${INPUT_CLASSES} h-auto py-2.5 leading-relaxed`}
          aria-invalid={errors.excerpt ? true : undefined}
          aria-describedby={errors.excerpt ? "excerpt-error" : undefined}
        />
        <span className="self-end text-xs font-normal tabular-nums text-admin-faint">{values.excerpt.length} / 300</span>
        <FieldError id="excerpt-error" message={errors.excerpt} />
      </label>

      <CoverField
        url={values.coverImageUrl}
        alt={values.coverImageAlt}
        onUrl={(url) => set("coverImageUrl", url)}
        onAlt={(alt) => set("coverImageAlt", alt)}
        error={errors.coverImageUrl ?? errors.coverImageAlt}
      />

      <div className={LABEL_CLASSES}>
        <span id="body-label">Post</span>
        <div className="overflow-hidden rounded-lg border border-admin-line bg-white focus-within:border-grape focus-within:ring-2 focus-within:ring-grape/20">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-admin-line bg-admin-canvas/60 px-2 py-1.5">
            <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5">
              <ToolButton label="Section heading" onClick={() => format("h2")} disabled={tab !== "write"}>
                H2
              </ToolButton>
              <ToolButton label="Small heading" onClick={() => format("h3")} disabled={tab !== "write"}>
                H3
              </ToolButton>
              <span aria-hidden className="mx-1 h-5 w-px bg-admin-line" />
              <ToolButton label="Bold" onClick={() => format("bold")} disabled={tab !== "write"}>
                <span className="font-black">B</span>
              </ToolButton>
              <ToolButton label="Italic" onClick={() => format("italic")} disabled={tab !== "write"}>
                <span className="font-serif italic">I</span>
              </ToolButton>
              <ToolButton label="Link" onClick={() => format("link")} disabled={tab !== "write"}>
                <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </ToolButton>
              <span aria-hidden className="mx-1 h-5 w-px bg-admin-line" />
              <ToolButton label="Bulleted list" onClick={() => format("ul")} disabled={tab !== "write"}>
                •≡
              </ToolButton>
              <ToolButton label="Numbered list" onClick={() => format("ol")} disabled={tab !== "write"}>
                1≡
              </ToolButton>
              <ToolButton label="Quote" onClick={() => format("quote")} disabled={tab !== "write"}>
                “ ”
              </ToolButton>
            </div>
            <div role="tablist" aria-label="Editor view" className="flex rounded-md bg-white p-0.5 ring-1 ring-admin-line">
              {(["write", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`h-7 rounded px-3 text-xs font-semibold capitalize ${tab === t ? "bg-grape text-white" : "text-admin-muted hover:text-admin-ink"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* The textarea stays in the form while previewing, so its value is always submitted. */}
          <textarea
            ref={bodyRef}
            name="body"
            value={values.body}
            onChange={(e) => set("body", e.target.value)}
            rows={22}
            hidden={tab !== "write"}
            aria-labelledby="body-label"
            aria-invalid={errors.body ? true : undefined}
            aria-describedby={errors.body ? "body-error" : "body-hint"}
            placeholder={"Start writing…\n\nUse the toolbar for headings, bold, links and lists."}
            className="block w-full resize-y px-4 py-3 font-mono text-[13px] leading-relaxed text-admin-ink outline-none placeholder:font-sans placeholder:text-admin-faint"
          />
          {tab === "preview" && (
            <div className="min-h-[440px] bg-night px-6 py-8 sm:px-10">
              {values.body.trim() ? <Markdown>{values.body}</Markdown> : <p className="text-white/50">Nothing to preview yet.</p>}
            </div>
          )}
        </div>
        <p id="body-hint" className="flex justify-between gap-4 text-xs font-normal text-admin-faint">
          <span>
            Markdown: <code>## Heading</code>, <code>**bold**</code>, <code>_italic_</code>, <code>[link](https://…)</code>, <code>- list</code>.
          </span>
          <span className="tabular-nums">{wordCount.toLocaleString("en-ZA")} words</span>
        </p>
        <FieldError id="body-error" message={errors.body} />
      </div>

      <input type="hidden" name="coverImageUrl" value={values.coverImageUrl} />
      <input type="hidden" name="coverImageAlt" value={values.coverImageAlt} />

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-3 border-t border-admin-line bg-white/95 px-5 py-4 backdrop-blur">
        {buttons.map((b) => (
          <button
            key={b.intent}
            type="submit"
            name="intent"
            value={b.intent}
            disabled={pending}
            className={b.primary ? PRIMARY_BUTTON : SECONDARY_BUTTON}
          >
            {b.label}
          </button>
        ))}
        <span role="status" className="text-xs text-admin-muted">
          {pending ? "Saving…" : dirty ? "Unsaved changes" : ""}
        </span>
      </div>
    </form>
  );
}

function ToolButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      // Keep the cursor in the writing box so typing carries on where the format was applied.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold text-admin-ink hover:bg-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** Upload / replace / remove the cover image, plus its description for screen readers. */
function CoverField({
  url,
  alt,
  onUrl,
  onAlt,
  error,
}: {
  url: string;
  alt: string;
  onUrl: (url: string) => void;
  onAlt: (alt: string) => void;
  error?: string;
}) {
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  function upload(file: File) {
    setUploadError(undefined);
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("That image is over 10 MB.");
      return;
    }
    const data = new FormData();
    data.set("file", file);
    startUpload(async () => {
      const result: CoverUploadResult = await uploadBlogCoverAction(data);
      if (result.ok) onUrl(result.url);
      else setUploadError(result.error);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className={LABEL_CLASSES}>
      <span>
        Cover image <span className="font-normal text-admin-faint">(optional)</span>
      </span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex aspect-[16/9] w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-admin-line bg-admin-canvas sm:w-64">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL with its own transforms
            <img src={blogCoverUrl(url, 512, 288)} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xs font-normal text-admin-faint">No cover yet</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className={`${SECONDARY_BUTTON} cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-grape`}>
              <AdminIcon name="upload" className="size-4" />
              {uploading ? "Uploading…" : url ? "Replace" : "Upload image"}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(file);
                }}
                className="sr-only"
              />
            </label>
            {url && (
              <button type="button" onClick={() => onUrl("")} className="text-sm font-medium text-admin-muted hover:text-coral-signal">
                Remove
              </button>
            )}
          </div>
          <p className="text-xs font-normal text-admin-faint">PNG, JPG or WebP, up to 10 MB. Wide images (16:9) look best.</p>
          {url && (
            <label className={LABEL_CLASSES}>
              Describe the image
              <input
                value={alt}
                onChange={(e) => onAlt(e.target.value)}
                maxLength={200}
                placeholder="e.g. A stack of holographic stickers catching the light"
                className={INPUT_CLASSES}
              />
              <span className="text-xs font-normal text-admin-faint">For people using screen readers.</span>
            </label>
          )}
          {(uploadError || error) && <p className="text-xs font-medium text-coral-signal">{uploadError ?? error}</p>}
        </div>
      </div>
    </div>
  );
}
