"use server";
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import type { Item } from "@/types/items";

function blogSeed(title: string) {
  return `---\ntitle: ${title}\ndate: ${new Date().toISOString()}\n---\n\n# ${title}\n\nStart writing…\n`;
}

// Create a new item (Directory or File) in R2.
export async function createS3Item(path: string, item: Item) {
  await requireAdmin();

  const itemPath = path ? `${path}/${item.slug}` : item.slug;
  // Directories are represented by a placeholder object with a trailing slash.
  const key = item.type === "Directory" ? `${itemPath}/` : itemPath;
  const isBlog = /\.mdx?$/i.test(key);

  const body =
    item.type === "Directory"
      ? ""
      : isBlog
        ? blogSeed(item.title)
        : "# " + item.title;

  const params: PutObjectCommandInput = {
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    Metadata: {
      title: item.title,
      type: item.type,
      visibility: item.visibility ?? "private",
      createdAt: item.createdAt.toString(),
    },
    ContentType:
      item.type === "Directory" ? "application/x-directory" : "text/markdown",
  };

  try {
    const data = await r2.send(new PutObjectCommand(params));
    revalidatePath(`/${path}`);
    return { success: true, data };
  } catch (err) {
    console.error("Error creating item:", err);
    throw new Error(
      `Failed to create ${item.type.toLowerCase()}: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
}
