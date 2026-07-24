"use server";

import { ArtworkTooLargeError, uploadArtwork } from "@/lib/cloudinary";
import { MAX_ARTWORK_BYTES } from "@/lib/uploadConstants";

export type UploadArtworkResult =
  | { ok: true; url: string; filename: string }
  | { ok: false; error: string };

/**
 * Called directly from the Upload step with a FormData built from the
 * selected File. Stores the artwork in Cloudinary and returns the resulting
 * URL — the configurator holds onto this client-side until a real order
 * (with customer details) can be created at checkout.
 */
export async function uploadArtworkAction(formData: FormData): Promise<UploadArtworkResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false, error: "No file was received." };
  }

  if (file.size > MAX_ARTWORK_BYTES) {
    return { ok: false, error: `File is too large — max ${MAX_ARTWORK_BYTES / 1024 / 1024}MB.` };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadArtwork(buffer, file.name);
    return { ok: true, url, filename: file.name };
  } catch (error) {
    if (error instanceof ArtworkTooLargeError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Upload failed — please try again." };
  }
}
