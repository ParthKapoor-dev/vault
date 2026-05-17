"use server";
import { r2, R2_BUCKET } from "@/lib/r2";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAdmin } from "@/lib/auth/session";

/** The password vault is a single opaque encrypted blob. */
const VAULT_KEY = "passwords/vault.enc";

/** Returns the raw encrypted vault blob (JSON string), or null if not created. */
export async function getVault(): Promise<string | null> {
  await requireAdmin();
  try {
    const res = await r2.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: VAULT_KEY }),
    );
    return (await res.Body?.transformToString()) ?? null;
  } catch {
    return null;
  }
}

/** Persists the encrypted vault blob. The server never sees plaintext. */
export async function saveVault(blob: string): Promise<void> {
  await requireAdmin();
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: VAULT_KEY,
      Body: blob,
      ContentType: "application/json",
    }),
  );
}
