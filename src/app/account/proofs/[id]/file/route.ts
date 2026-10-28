import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isEmailVerified } from "@/lib/auth";
import { findCustomerProofFile } from "@/lib/proofs";
import { BUCKETS, signedFileUrl } from "@/lib/storage";

/**
 * Serves a customer's proof file: checks the proof is on one of the session
 * user's orders, then redirects to a fresh 5-minute signed URL. Anything
 * else is a plain 404 — the same as a proof that doesn't exist.
 * ?download=1 asks the browser to save it with its original name.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !isEmailVerified(user)) return notFoundResponse();

  const file = await findCustomerProofFile(user.id, id);
  if (!file) return notFoundResponse();

  const download = request.nextUrl.searchParams.get("download") === "1";
  const url = await signedFileUrl(BUCKETS.proofs, file.storagePath, download ? { downloadAs: file.originalFilename } : {});
  return redirectNoStore(url);
}

function notFoundResponse() {
  return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

function redirectNoStore(url: string) {
  const res = NextResponse.redirect(url, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
