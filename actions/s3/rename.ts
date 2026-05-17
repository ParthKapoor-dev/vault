"use server";
import { r2, R2_BUCKET } from "@/lib/r2";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

async function headMeta(key: string) {
  try {
    const head = await r2.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );
    return {
      metadata: head.Metadata ?? {},
      contentType: head.ContentType,
    };
  } catch {
    return null;
  }
}

/**
 * Rename/retitle an item. Copies to the new key preserving all existing
 * metadata (R2 CopyObject with REPLACE otherwise wipes unspecified metadata),
 * then deletes the old key. Directories are moved recursively.
 */
export async function renameS3Item(
  path: string,
  oldSlug: string,
  updatedData: { title: string; slug: string },
) {
  await requireAdmin();

  const oldKey = path ? `${path}/${oldSlug}` : oldSlug;
  const newKey = path ? `${path}/${updatedData.slug}` : updatedData.slug;

  try {
    const fileMeta = await headMeta(oldKey);

    if (fileMeta) {
      // It's a file (or any single object).
      await r2.send(
        new CopyObjectCommand({
          Bucket: R2_BUCKET,
          CopySource: encodeURI(`${R2_BUCKET}/${oldKey}`),
          Key: newKey,
          ContentType: fileMeta.contentType,
          Metadata: { ...fileMeta.metadata, title: updatedData.title },
          MetadataDirective: "REPLACE",
        }),
      );
      await r2.send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: oldKey }),
      );
    } else {
      // Treat as a directory: move the placeholder and every nested object.
      let token: string | undefined;
      do {
        const listed = await r2.send(
          new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            Prefix: `${oldKey}/`,
            ContinuationToken: token,
          }),
        );
        for (const obj of listed.Contents ?? []) {
          if (!obj.Key) continue;
          const suffix = obj.Key.slice(`${oldKey}/`.length);
          const dest = `${newKey}/${suffix}`;
          const head = await headMeta(obj.Key);
          const meta = head?.metadata ?? {};
          const isPlaceholder = suffix === "";
          await r2.send(
            new CopyObjectCommand({
              Bucket: R2_BUCKET,
              CopySource: encodeURI(`${R2_BUCKET}/${obj.Key}`),
              Key: dest,
              ContentType: head?.contentType,
              Metadata: isPlaceholder
                ? { ...meta, title: updatedData.title }
                : meta,
              MetadataDirective: "REPLACE",
            }),
          );
          await r2.send(
            new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: obj.Key }),
          );
        }
        token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
      } while (token);
    }

    revalidatePath(`/${path}`);
    return { success: true };
  } catch (err) {
    console.error("Error renaming item:", err);
    throw new Error(
      `Failed to rename item: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
}
