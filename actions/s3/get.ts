"use server";
import { r2, R2_BUCKET } from "@/lib/r2";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import type { Visibility } from "@/types/items";

export interface ResolvedFile {
  key: string;
  title: string;
  contentType: string;
  visibility: Visibility;
  size: number;
  /** True for markdown/MDX blog documents. */
  isBlog: boolean;
}

/** Returns file metadata for an exact key, or null if it isn't an object. */
export async function headFile(key: string): Promise<ResolvedFile | null> {
  try {
    const head = await r2.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );
    return {
      key,
      title: head.Metadata?.title || key.split("/").pop() || key,
      contentType: head.ContentType || "application/octet-stream",
      visibility:
        head.Metadata?.visibility === "public" ? "public" : "private",
      size: head.ContentLength || 0,
      isBlog: /\.mdx?$/i.test(key),
    };
  } catch {
    return null;
  }
}

/** Reads a (text) object's body as a string. Used for blog content. */
export async function getObjectText(key: string): Promise<string> {
  const res = await r2.send(
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
  return (await res.Body?.transformToString()) ?? "";
}
