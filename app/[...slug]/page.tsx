import PageLayout from "@/components/PageTemplate";
import { FileViewer } from "@/components/file-viewer";
import { BlogViewer } from "@/components/blog-viewer";
import { BlogEditor } from "@/components/blog-editor";
import { notFound } from "next/navigation";
import { listObjectsV2 } from "@/actions/s3/list";
import { headFile, getObjectText } from "@/actions/s3/get";
import { getSession } from "@/lib/auth/session";

// Listings depend on the visitor's session (admin sees private items).
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ edit?: string }>;
}

/**
 * Single entry point for vault paths: resolves to a blog, a file viewer, or a
 * directory listing depending on what the path points at.
 */
export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { edit } = await searchParams;
  const pathName = (slug ?? []).join("/");

  const file = await headFile(pathName);
  if (file) {
    const session = await getSession();
    const isAdmin = !!session?.isAdmin;
    if (file.visibility === "private" && !isAdmin) {
      return notFound();
    }

    if (file.isBlog) {
      if (edit && isAdmin) {
        const content = await getObjectText(file.key);
        return <BlogEditor blogKey={file.key} initialContent={content} />;
      }
      return <BlogViewer file={file} isAdmin={isAdmin} />;
    }

    return <FileViewer file={file} />;
  }

  const items = await listObjectsV2(pathName);
  if (!items) {
    return notFound();
  }
  return <PageLayout items={items} path={pathName} />;
}
