"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveBlogContent, renderBlogPreview } from "@/actions/s3/blog";

interface BlogEditorProps {
  /** Full R2 key of the blog document. */
  blogKey: string;
  initialContent: string;
}

export const BlogEditor = ({ blogKey, initialContent }: BlogEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [preview, setPreview] = useState<ReactNode>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recompile the preview (debounced) whenever the preview tab is active.
  useEffect(() => {
    if (tab !== "preview") return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      renderBlogPreview(content)
        .then(setPreview)
        .catch(() => setPreview(<p className="text-muted">Preview failed.</p>));
    }, 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [content, tab]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBlogContent(blogKey, content);
      toast.success("Saved");
      router.push(`/${blogKey}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save",
      );
    } finally {
      setSaving(false);
    }
  };

  const tabClass = (active: boolean) =>
    `px-3 py-1 text-sm rounded-sm ${
      active ? "bg-gray-12 text-gray-1" : "text-muted hover:bg-hover"
    }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={tabClass(tab === "write")}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={tabClass(tab === "preview")}
          >
            Preview
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/${blogKey}`)}
            className="rounded-sm border border-border px-3 py-1 text-sm hover:bg-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-sm bg-gray-12 px-3 py-1 text-sm text-gray-1 hover:opacity-80 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="min-h-[60vh] w-full resize-y rounded-sm border border-border bg-background p-4 font-mono text-sm outline-none focus:border-gray-8"
          placeholder="Write your post in Markdown / MDX…"
        />
      ) : (
        <div className="min-h-[60vh] rounded-sm border border-border p-4">
          {preview ?? <p className="text-muted">Rendering…</p>}
        </div>
      )}
    </div>
  );
};
