"use server";
import type {
  DeleteObjectCommandInput,
  CopyObjectCommandInput,
} from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { Items } from "@/types/items";

export async function listObjectsV2(path: string = ""): Promise<Items | null> {
  try {
    // Construct the prefix - ensure it ends with / for proper directory listing
    const prefix = path ? `${path}/` : "";

    const params = {
      Bucket: process.env.SPACES_BUCKET || "",
      Prefix: prefix,
      Delimiter: "/", // This helps organize results by "folders"
    };

    const command = new ListObjectsV2Command(params);
    const response = await s3Client.send(command);

    const items: Items = [];

    // Process "folders" (CommonPrefixes)
    if (response.CommonPrefixes) {
      for (const commonPrefix of response.CommonPrefixes) {
        if (commonPrefix.Prefix && commonPrefix.Prefix !== prefix) {
          // Extract folder name from prefix
          const folderName = commonPrefix.Prefix.replace(prefix, "").replace(
            "/",
            "",
          );

          // Try to get metadata for the folder (some systems store folder metadata)
          try {
            const headParams = {
              Bucket: process.env.SPACES_BUCKET || "",
              Key: commonPrefix.Prefix,
            };

            const headResponse = await s3Client.send(
              new HeadObjectCommand(headParams),
            );

            items.push({
              type: "Directory",
              title: headResponse.Metadata?.title || folderName,
              slug: folderName,
              createdAt: headResponse.LastModified?.getTime() || Date.now(),
            });
          } catch {
            // If no metadata exists, create a basic directory entry
            items.push({
              type: "Directory",
              title: folderName,
              slug: folderName,
              createdAt: Date.now(), // Fallback timestamp
            });
          }
        }
      }
    }

    // Process files (Contents)
    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key && object.Key !== prefix && !object.Key.endsWith("/")) {
          // Extract filename from key
          const fileName = object.Key.replace(prefix, "");

          // Skip if this is a nested file (contains additional slashes)
          if (fileName.includes("/")) continue;

          // Try to get metadata for the file
          try {
            const headParams = {
              Bucket: process.env.SPACES_BUCKET || "",
              Key: object.Key,
            };

            const headResponse = await s3Client.send(
              new HeadObjectCommand(headParams),
            );

            items.push({
              type: "File",
              title: headResponse.Metadata?.title || fileName,
              slug: fileName,
              createdAt: object.LastModified?.getTime() || Date.now(),
            });
          } catch {
            // If no metadata exists, create a basic file entry
            items.push({
              type: "File",
              title: fileName,
              slug: fileName,
              createdAt: object.LastModified?.getTime() || Date.now(),
            });
          }
        }
      }
    }

    // If no items found and this is not the root path, return []
    if (items.length === 0 && path !== "") {
      return [];
    }

    return items;
  } catch (error) {
    console.error("Error listing S3 objects:", error);
    return null;
  }
}
