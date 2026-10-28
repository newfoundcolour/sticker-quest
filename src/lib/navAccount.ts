import "server-only";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isEmailVerified } from "@/lib/auth";

/** What the nav bar needs to know about the signed-in customer. Safe to pass to the client. */
export type NavAccount = {
  initials: string;
  firstName: string;
  /** Unread staff replies in support conversations. */
  unreadSupport: number;
  /** Proofs waiting for the customer's approval. */
  proofsAwaiting: number;
};

function initialsFor(firstName: string, lastName: string, email: string): string {
  const fromName = `${firstName.trim()[0] ?? ""}${lastName.trim()[0] ?? ""}`.toUpperCase();
  return fromName || (email[0] ?? "?").toUpperCase();
}

export async function getNavAccount(): Promise<NavAccount | null> {
  const user = await getSessionUser();
  if (!user || !isEmailVerified(user)) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true, email: true },
  });

  return {
    initials: initialsFor(profile?.firstName ?? "", profile?.lastName ?? "", profile?.email ?? user.email ?? ""),
    firstName: profile?.firstName ?? "",
    // TODO(phase 5): count unread staff messages in the user's support conversations.
    unreadSupport: 0,
    // TODO(phase 4): count the user's pending proofs on orders awaiting approval.
    proofsAwaiting: 0,
  };
}
