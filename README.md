# Vault

A minimal, fast personal vault — store files, write blog posts, and keep
passwords, all behind GitHub authentication. Backed entirely by **Cloudflare
R2**: no database, no Redis, nothing else to run.

## Features

- **GitHub auth** — stateless, custom OAuth flow with a signed JWT cookie
  (`jose`). No auth database.
- **Per-item visibility** — every file, folder, and post is independently
  toggleable between **public** and **private**. Logged-out visitors only ever
  see public items.
- **File storage** — uploads go straight from the browser to R2 via presigned
  URLs (no serverless size limit). Images, PDFs and text render inline.
- **Blog posts** — Markdown/MDX documents with a built-in editor (live
  preview) and syntax-highlighted rendering.
- **Password vault** — zero-knowledge. A master passphrase derives an
  AES-256-GCM key **in your browser**; R2 only ever stores ciphertext. The
  passphrase and decrypted data never touch the server.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS · `@aws-sdk/client-s3`
(R2) · `jose` · `next-mdx-remote` · Web Crypto API.

## Setup

1. **Install**

   ```bash
   pnpm install
   ```

2. **Cloudflare R2** — create a bucket and an R2 API token (Account ID, Access
   Key ID, Secret Access Key).

   For browser uploads to work, add a **CORS policy** to the bucket allowing
   `PUT` and `GET` from your site origin:

   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://your-domain"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

3. **GitHub OAuth app** — create one at
   <https://github.com/settings/developers>. Set the **Authorization callback
   URL** to `<NEXT_PUBLIC_SITE_URL>/api/auth/callback`.

4. **Environment** — copy `.env.example` to `.env.local` and fill it in.
   Generate `SESSION_SECRET` with `openssl rand -base64 48`. Set
   `GITHUB_ADMIN_EMAIL` to the GitHub email that should own the vault (admin).

5. **Run**

   ```bash
   pnpm dev      # http://localhost:3000
   pnpm build    # production build
   ```

## How the password vault works

The vault is a single encrypted blob at `passwords/vault.enc` in R2:

- A master passphrase + PBKDF2 (600k iterations) derive an AES-256-GCM key in
  the browser.
- Entries are encrypted/decrypted client-side only.
- The server actions read and write the opaque ciphertext — they never see the
  passphrase, the key, or any plaintext.
- There is no recovery: lose the passphrase and the vault is unrecoverable.

## Roles

- **Admin** (`GITHUB_ADMIN_EMAIL`) — full read/write, sees private items, owns
  the password vault.
- **Everyone else** — read-only access to public items.
