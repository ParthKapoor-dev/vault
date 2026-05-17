"use server";
import { r2, R2_BUCKET } from "@/lib/r2";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

// Delete an item. Directories are deleted recursively (placeholder + children).
export async function deleteS3Item(path: string, slug: string) {
  await requireAdmin();

  const key = path ? `${path}/${slug}` : slug;

  try {
    // Delete the object itself (file, or directory placeholder).
    await r2
      .send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
      .catch(() => {});

    // If it's a directory, delete everything nested under it.
    let token: string | undefined;
    do {
      const listed = await r2.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET,
          Prefix: `${key}/`,
          ContinuationToken: token,
        }),
      );
      const objects = (listed.Contents ?? [])
        .map((o) => o.Key)
        .filter((k): k is string => !!k);
      if (objects.length > 0) {
        await r2.send(
          new DeleteObjectsCommand({
            Bucket: R2_BUCKET,
            Delete: { Objects: objects.map((Key) => ({ Key })) },
          }),
        );
      }
      token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (token);

    revalidatePath(`/${path}`);
    return { success: true };
  } catch (err) {
    console.error("Error deleting item:", err);
    throw new Error(
      `Failed to delete item: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
}
