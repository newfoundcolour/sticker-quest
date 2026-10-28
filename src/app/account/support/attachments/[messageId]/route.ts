import { NextResponse } from "next/server";
import { getSessionUser, isEmailVerified } from "@/lib/auth";
import { findCustomerAttachment } from "@/lib/support";
import { BUCKETS, signedFileUrl } from "@/lib/storage";

/**
 * A support attachment, for the customer whose conversation it's in: checks
 * ownership from the session, then redirects to a fresh 5-minute signed URL.
 * Anyone else gets a 404.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await params;
  const user = await getSessionUser();
  if (!user || !isEmailVerified(user)) return notFound();

  const file = await findCustomerAttachment(user.id, messageId);
  if (!file?.attachmentPath) return notFound();

  const res = NextResponse.redirect(await signedFileUrl(BUCKETS.supportAttachments, file.attachmentPath), 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}
