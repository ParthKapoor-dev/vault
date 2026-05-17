"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { getUploadUrl, finalizeUpload } from "@/actions/s3/presign";
import type { Item, Visibility } from "@/types/items";

const fieldClass =
  "w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gray-8";

interface UploadProps {
  path: string;
  onUploaded: (item: Item) => void;
  onCancel: () => void;
}

export const Upload = ({ path, onUploaded, onCancel }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const putToR2 = (url: string, contentType: string, body: File) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () =>
        xhr.status < 300
          ? resolve()
          : reject(new Error(`Upload failed (${xhr.status})`));
      xhr.onerror = () => reject(new Error("Upload failed — check R2 CORS."));
      xhr.send(body);
    });

  const handleUpload = async () => {
    if (!file) return;
    const contentType = file.type || "application/octet-stream";
    setProgress(0);
    try {
      const { url, key } = await getUploadUrl(path, file.name, contentType);
      await putToR2(url, contentType, file);
      await finalizeUpload(
        path,
        key,
        title.trim() || file.name,
        visibility,
        contentType,
      );
      onUploaded({
        type: "File",
        title: title.trim() || file.name,
        slug: key.split("/").pop() || file.name,
        visibility,
        createdAt: Date.now(),
      });
      toast.success(`Uploaded ${file.name}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload failed",
      );
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="my-3 rounded-sm border border-border bg-background p-4">
      <h3 className="mb-3 text-sm font-medium">Upload file</h3>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-border py-6 text-sm text-muted hover:bg-hover"
        >
          <UploadCloud size={16} />
          {file ? file.name : "Choose a file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (f && !title) setTitle(f.name);
          }}
        />
        <div className="flex gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className={fieldClass}
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            className={fieldClass}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>

        {progress !== null && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-hover">
            <div
              className="h-full bg-gray-12 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || progress !== null}
            className="rounded-sm bg-gray-12 px-4 py-2 text-sm text-gray-1 hover:opacity-80 disabled:opacity-50"
          >
            {progress !== null ? `Uploading… ${progress}%` : "Upload"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border border-border px-4 py-2 text-sm hover:bg-hover"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
