"use server";
import type { DeleteObjectCommandInput } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

// Delete an item
export async function deleteS3Item(path: string, slug: string) {
  const key = path ? `${path}/${slug}` : slug;

  const params: DeleteObjectCommandInput = {
    Bucket: process.env.SPACES_BUCKET || "",
    Key: key,
  };

  try {
    const data = await s3Client.send(new DeleteObjectCommand(params));
    console.log(`Successfully deleted object: ${params.Bucket}/${params.Key}`);

    // Revalidate the current path to refresh the data
    revalidatePath(`/${path}`);

    return { success: true, data };
  } catch (err) {
    console.error("Error deleting item:", err);
    throw new Error(
      `Failed to delete item: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
}
