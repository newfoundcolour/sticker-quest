import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfile, isStaffRole } from "@/lib/auth";
import { findProofFileForStaff } from "@/lib/proofs";
import { BUCKETS, signedFileUrl } from "@/lib/storage";

/** Staff-only: redirects to a fresh 5-minute signed URL for any proof file. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!isStaffRole(profile)) return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const file = await findProofFileForStaff(id);
  if (!file) return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const download = request.nextUrl.searchParams.get("download") === "1";
  const url = await signedFileUrl(BUCKETS.proofs, file.storagePath, download ? { downloadAs: file.originalFilename } : {});
  const res = NextResponse.redirect(url, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
