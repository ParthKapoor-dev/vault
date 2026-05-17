"use server";
import { r2, R2_BUCKET } from "@/lib/r2";
import {
  CopyObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { getSession, requireAdmin } from "@/lib/auth/session";
import type { Visibility } from "@/types/items";

const sanitize = (name: string) =>
  name.trim().replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");

/**
 * Issues a short-lived presigned PUT URL so the browser uploads straight to R2
 * (avoids the serverless request-body size limit). Only ContentType is signed,
 * so the client just needs to echo that one header.
 */
export async function getUploadUrl(
  path: string,
  filename: string,
  contentType: string,
) {
  await requireAdmin();
  const safeName = sanitize(filename);
  const key = path ? `${path}/${safeName}` : safeName;

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 600 },
  );
  return { url, key };
}

/** After the browser PUT completes, stamp the object with vault metadata. */
export async function finalizeUpload(
  path: string,
  key: string,
  title: string,
  visibility: Visibility,
  contentType: string,
) {
  await requireAdmin();
  await r2.send(
    new CopyObjectCommand({
      Bucket: R2_BUCKET,
      CopySource: encodeURI(`${R2_BUCKET}/${key}`),
      Key: key,
      ContentType: contentType,
      Metadata: { title, type: "File", visibility },
      MetadataDirective: "REPLACE",
    }),
  );
  revalidatePath(`/${path}`);
}

/** Presigned GET URL for viewing/downloading. Private files require admin. */
export async function getDownloadUrl(key: string): Promise<string> {
  const head = await r2.send(
    new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
  const isPublic = head.Metadata?.visibility === "public";
  if (!isPublic) {
    const session = await getSession();
    if (!session?.isAdmin) {
      throw new Error("Unauthorized: this file is private.");
    }
  }
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn: 600 },
  );
}
