"use server";
import { r2, R2_BUCKET } from "@/lib/r2";
import { HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSession } from "@/lib/auth/session";
import type { Items, Item } from "@/types/items";

/** Reserved prefix for the password vault — never surfaced in normal listings. */
const HIDDEN_PREFIX = "passwords";

/**
 * Lists directories and files at a given vault path. Backed by Cloudflare R2.
 * Non-admins only ever receive items marked `public`.
 */
export async function listObjectsV2(path: string = ""): Promise<Items | null> {
  try {
    const prefix = path ? `${path}/` : "";

    const response = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
        Delimiter: "/",
      }),
    );

    const tasks: Promise<Item | null>[] = [];

    // Directories (CommonPrefixes)
    for (const cp of response.CommonPrefixes ?? []) {
      if (!cp.Prefix || cp.Prefix === prefix) continue;
      const name = cp.Prefix.replace(prefix, "").replace(/\/$/, "");
      if (path === "" && name === HIDDEN_PREFIX) continue;
      tasks.push(
        (async (): Promise<Item> => {
          try {
            const head = await r2.send(
              new HeadObjectCommand({ Bucket: R2_BUCKET, Key: cp.Prefix }),
            );
            return {
              type: "Directory",
              title: head.Metadata?.title || name,
              slug: name,
              visibility:
                head.Metadata?.visibility === "public" ? "public" : "private",
              createdAt: head.LastModified?.getTime() || Date.now(),
            };
          } catch {
            return {
              type: "Directory",
              title: name,
              slug: name,
              visibility: "private",
              createdAt: Date.now(),
            };
          }
        })(),
      );
    }

    // Files (Contents)
    for (const object of response.Contents ?? []) {
      if (!object.Key || object.Key === prefix || object.Key.endsWith("/"))
        continue;
      const fileName = object.Key.replace(prefix, "");
      if (fileName.includes("/")) continue;
      const key = object.Key;
      tasks.push(
        (async (): Promise<Item> => {
          try {
            const head = await r2.send(
              new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
            );
            return {
              type: "File",
              title: head.Metadata?.title || fileName,
              slug: fileName,
              visibility:
                head.Metadata?.visibility === "public" ? "public" : "private",
              createdAt: object.LastModified?.getTime() || Date.now(),
            };
          } catch {
            return {
              type: "File",
              title: fileName,
              slug: fileName,
              visibility: "private",
              createdAt: object.LastModified?.getTime() || Date.now(),
            };
          }
        })(),
      );
    }

    const items = (await Promise.all(tasks)).filter(
      (i): i is Item => i !== null,
    );

    // Non-admins only ever see public items.
    const session = await getSession();
    if (!session?.isAdmin) {
      return items.filter((i) => i.visibility === "public");
    }

    return items;
  } catch (error) {
    console.error("Error listing R2 objects:", error);
    return null;
  }
}
