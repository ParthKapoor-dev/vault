"use server";
import type {
  PutObjectCommandInput,
  DeleteObjectCommandInput,
  CopyObjectCommandInput,
} from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { Item } from "@/types/items";

// Create a new item (Directory or File)
export async function createS3Item(path: string, item: Item) {
  const itemPath = path ? `${path}/${item.slug}` : item.slug;

  // For directories, create a placeholder object with trailing slash
  const key = item.type === "Directory" ? `${itemPath}/` : itemPath;

  const metadata = {
    title: item.title,
    type: item.type,
    createdAt: item.createdAt.toString(),
  };

  const params: PutObjectCommandInput = {
    Bucket: process.env.SPACES_BUCKET || "",
    Key: key,
    Body: item.type === "Directory" ? "" : "# " + item.title, // Empty for directories, basic content for files
    ACL: "private",
    Metadata: metadata,
    ContentType:
      item.type === "Directory" ? "application/x-directory" : "text/markdown",
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    console.log(
      `Successfully created ${item.type}: ${params.Bucket}/${params.Key}`,
    );

    // Revalidate the current path to refresh the data
    revalidatePath(`/${path}`);

    return { success: true, data };
  } catch (err) {
    console.error("Error creating item:", err);
    throw new Error(
      `Failed to create ${item.type.toLowerCase()}: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
}

// List objects in a path (helper function for fetching items)
export async function listS3Items(path: string = "") {
  // This would be implemented based on your specific S3 listing needs
  // You might want to use ListObjectsV2Command here
  // This is a placeholder - implement based on your existing data fetching logic
}
