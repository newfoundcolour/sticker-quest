import "server-only";
import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Private Supabase Storage for proofs and support attachments.
 *
 * Uses the service role key, which bypasses all Storage policies — so it
 * must stay server-only (this file imports "server-only"; the key is never
 * NEXT_PUBLIC_). Buckets are private: files are only reachable through
 * short-lived signed URLs, and callers must check ownership before asking
 * for one.
 */
export const BUCKETS = {
  proofs: "proofs",
  supportAttachments: "support-attachments",
} as const;
export type Bucket = (typeof BUCKETS)[keyof typeof BUCKETS];

/** How long a signed URL works. Links are re-signed on every request. */
export const SIGNED_URL_SECONDS = 5 * 60;

let client: SupabaseClient | undefined;

function storageClient(): SupabaseClient {
  if (client) return client;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

/** A random, unguessable storage path: <prefix>/<uuid>.<ext>. Never the uploader's file name. */
export function randomStoragePath(prefix: string, ext: string): string {
  return `${prefix}/${randomUUID()}.${ext}`;
}

export async function uploadPrivateFile(bucket: Bucket, path: string, bytes: Uint8Array, contentType: string) {
  const { error } = await storageClient().storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: false, // never overwrite an existing file
    cacheControl: "private, max-age=0, no-store",
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
}

export async function removePrivateFile(bucket: Bucket, path: string) {
  const { error } = await storageClient().storage.from(bucket).remove([path]);
  if (error) console.error("Storage remove failed:", error.message);
}

/** Short-lived link to one private file. Only call after checking the viewer may see it. */
export async function signedFileUrl(
  bucket: Bucket,
  path: string,
  opts: { downloadAs?: string } = {},
): Promise<string> {
  const { data, error } = await storageClient()
    .storage.from(bucket)
    .createSignedUrl(path, SIGNED_URL_SECONDS, opts.downloadAs ? { download: opts.downloadAs } : undefined);
  if (error || !data) throw new Error(`Couldn't sign storage URL: ${error?.message}`);
  return data.signedUrl;
}
