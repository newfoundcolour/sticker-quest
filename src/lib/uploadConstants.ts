/** Shared between the client upload UI and the server-side Cloudinary action. No server imports here — safe for "use client" components. */
export const MAX_ARTWORK_BYTES = 25 * 1024 * 1024; // 25MB, per the Upload step's stated limit
