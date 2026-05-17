import matter from "gray-matter";
import { getObjectText } from "@/actions/s3/get";
import type { ResolvedFile } from "@/actions/s3/get";
import { MDX } from "@/mdx-components";
import { Link } from "next-view-transitions";
import { Pencil } from "lucide-react";

/** Renders a markdown/MDX blog document. */
export async function BlogViewer({
  file,
  isAdmin,
}: {
  file: ResolvedFile;
  isAdmin: boolean;
}) {
  const raw = await getObjectText(file.key);
  const { content, data } = matter(raw);
  const title = (data.title as string) || file.title;

  return (
    <article className="flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="capitalize">{title}</h1>
        {isAdmin && (
          <Link
            href={`/${file.key}?edit=1`}
            className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <Pencil size={14} /> Edit
          </Link>
        )}
      </div>
      <MDX source={content} />
    </article>
  );
}
