import { getDownloadUrl } from "@/actions/s3/presign";
import type { ResolvedFile } from "@/actions/s3/get";
import { Download } from "lucide-react";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Server component that renders a vault file inline by content type. */
export async function FileViewer({ file }: { file: ResolvedFile }) {
  const url = await getDownloadUrl(file.key);
  const ct = file.contentType;

  let body: React.ReactNode;
  if (ct.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    body = (
      <img
        src={url}
        alt={file.title}
        className="w-full rounded-sm border border-border"
      />
    );
  } else if (ct === "application/pdf") {
    body = (
      <embed
        src={url}
        type="application/pdf"
        className="h-[80vh] w-full rounded-sm border border-border"
      />
    );
  } else if (ct.startsWith("text/") || ct === "application/json") {
    const text = await fetch(url).then((r) => r.text());
    body = (
      <pre className="overflow-x-auto rounded-sm border border-border bg-hover p-4 text-sm">
        {text}
      </pre>
    );
  } else {
    body = (
      <div className="rounded-sm border border-dashed border-border p-8 text-center text-sm text-muted">
        No inline preview for this file type.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="capitalize">{file.title}</h2>
        <a
          href={url}
          download
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <Download size={14} /> {formatSize(file.size)}
        </a>
      </div>
      {body}
    </div>
  );
}
