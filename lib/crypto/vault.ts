/**
 * Zero-knowledge password vault crypto — runs entirely in the browser.
 *
 * The master passphrase never leaves the device. A PBKDF2-derived AES-256-GCM
 * key encrypts the vault; the server (R2) only ever stores opaque ciphertext.
 */

export const KDF_ITERATIONS = 600_000;
const VERIFIER_PLAINTEXT = "vault-ok";

export interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  updatedAt: number;
}

interface Sealed {
  iv: string;
  ciphertext: string;
}

export interface VaultBlob {
  version: 1;
  kdf: {
    name: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
  };
  /** Encrypts a known constant — lets us detect a wrong passphrase. */
  verifier: Sealed;
  /** Encrypts the JSON array of entries. */
  vault: Sealed;
}

/* ----------------------------- base64 helpers ---------------------------- */

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/* ------------------------------- key + AES -------------------------------- */

async function deriveKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false, // non-extractable
    ["encrypt", "decrypt"],
  );
}

async function seal(key: CryptoKey, plaintext: string): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return {
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
}

async function open(key: CryptoKey, sealed: Sealed): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(sealed.iv) },
    key,
    fromBase64(sealed.ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}

/* --------------------------------- vault --------------------------------- */

/** Builds a brand-new empty vault for a chosen passphrase. */
export async function createVault(
  passphrase: string,
): Promise<{ blob: VaultBlob; key: CryptoKey; entries: PasswordEntry[] }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt, KDF_ITERATIONS);
  const entries: PasswordEntry[] = [];
  const blob: VaultBlob = {
    version: 1,
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: KDF_ITERATIONS,
      salt: toBase64(salt),
    },
    verifier: await seal(key, VERIFIER_PLAINTEXT),
    vault: await seal(key, JSON.stringify(entries)),
  };
  return { blob, key, entries };
}

/** Unlocks an existing vault. Throws if the passphrase is wrong. */
export async function unlockVault(
  blob: VaultBlob,
  passphrase: string,
): Promise<{ key: CryptoKey; entries: PasswordEntry[] }> {
  const key = await deriveKey(
    passphrase,
    fromBase64(blob.kdf.salt),
    blob.kdf.iterations,
  );
  try {
    const verifier = await open(key, blob.verifier);
    if (verifier !== VERIFIER_PLAINTEXT) throw new Error("bad");
  } catch {
    throw new Error("Incorrect passphrase.");
  }
  const entries = JSON.parse(await open(key, blob.vault)) as PasswordEntry[];
  return { key, entries };
}

/** Re-encrypts entries into the blob (fresh IV) after any change. */
export async function sealVault(
  blob: VaultBlob,
  key: CryptoKey,
  entries: PasswordEntry[],
): Promise<VaultBlob> {
  return { ...blob, vault: await seal(key, JSON.stringify(entries)) };
}
