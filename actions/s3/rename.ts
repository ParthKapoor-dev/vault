"use server";
import type {
  DeleteObjectCommandInput,
  CopyObjectCommandInput,
} from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

// Update an existing item (rename)
export async function renameS3Item(
  path: string,
  oldSlug: string,
  updatedData: { title: string; slug: string },
) {
  const oldKey = path ? `${path}/${oldSlug}` : oldSlug;
  const newKey = path ? `${path}/${updatedData.slug}` : updatedData.slug;

  try {
    // First, copy the object to the new location with updated metadata
    const copyParams: CopyObjectCommandInput = {
      Bucket: process.env.SPACES_BUCKET || "",
      CopySource: `${process.env.SPACES_BUCKET}/${oldKey}`,
      Key: newKey,
      Metadata: {
        title: updatedData.title,
        slug: updatedData.slug,
      },
      MetadataDirective: "REPLACE",
    };

    await s3Client.send(new CopyObjectCommand(copyParams));

    // Then delete the old object
    const deleteParams: DeleteObjectCommandInput = {
      Bucket: process.env.SPACES_BUCKET || "",
      Key: oldKey,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));

    console.log(`Successfully updated item from ${oldKey} to ${newKey}`);

    // Revalidate the current path to refresh the data
    revalidatePath(`/${path}`);

    return { success: true };
  } catch (err) {
    console.error("Error updating item:", err);
    throw new Error(
      `Failed to update item: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
}
