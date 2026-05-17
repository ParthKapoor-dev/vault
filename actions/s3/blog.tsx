"use server";
import type { ReactNode } from "react";
import { r2, R2_BUCKET } from "@/lib/r2";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { MDX } from "@/mdx-components";

/**
 * Overwrites a blog document's body while preserving its existing metadata
 * (title / visibility) — a bare PutObject would otherwise drop them.
 */
export async function saveBlogContent(key: string, content: string) {
  await requireAdmin();

  let metadata: Record<string, string> = {};
  try {
    const head = await r2.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );
    metadata = head.Metadata ?? {};
  } catch {
    metadata = {};
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: content,
      ContentType: "text/markdown",
      Metadata: metadata,
    }),
  );

  revalidatePath(`/${key}`);
  return { success: true };
}

/** Compiles MDX on the server for the editor's live preview. */
export async function renderBlogPreview(source: string): Promise<ReactNode> {
  return <MDX source={source} />;
}
