"use server";
import { r2, R2_BUCKET } from "@/lib/r2";
import { CopyObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import type { Visibility } from "@/types/items";

/**
 * Flip an item between public and private. Copies the object onto itself with
 * REPLACE metadata (the S3-compatible way to mutate metadata in place),
 * preserving every other metadata field.
 */
export async function toggleVisibility(
  path: string,
  slug: string,
  type: "Directory" | "File",
  next: Visibility,
) {
  await requireAdmin();

  const base = path ? `${path}/${slug}` : slug;
  const key = type === "Directory" ? `${base}/` : base;

  try {
    const head = await r2.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );
    await r2.send(
      new CopyObjectCommand({
        Bucket: R2_BUCKET,
        CopySource: encodeURI(`${R2_BUCKET}/${key}`),
        Key: key,
        ContentType: head.ContentType,
        Metadata: { ...(head.Metadata ?? {}), visibility: next },
        MetadataDirective: "REPLACE",
      }),
    );
    revalidatePath(`/${path}`);
    return { success: true };
  } catch (err) {
    console.error("Error toggling visibility:", err);
    throw new Error(
      `Failed to update visibility: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
}
