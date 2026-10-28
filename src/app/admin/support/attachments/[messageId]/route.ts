import { NextResponse } from "next/server";
import { getCurrentProfile, isStaffRole } from "@/lib/auth";
import { findAttachmentForStaff } from "@/lib/support";
import { BUCKETS, signedFileUrl } from "@/lib/storage";

/** Staff-only: redirects to a fresh 5-minute signed URL for a support attachment. */
export async function GET(_request: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await params;
  const profile = await getCurrentProfile();
  if (!isStaffRole(profile)) return notFound();

  const file = await findAttachmentForStaff(messageId);
  if (!file?.attachmentPath) return notFound();

  const res = NextResponse.redirect(await signedFileUrl(BUCKETS.supportAttachments, file.attachmentPath), 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}
