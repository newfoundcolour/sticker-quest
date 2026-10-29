import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isEmailVerified } from "@/lib/auth";
import { countProofsAwaiting } from "@/lib/proofs";
import { countUnreadForCustomer } from "@/lib/support";

/** What the nav bar needs to know about the signed-in customer. Safe to pass to the client. */
export type NavAccount = {
  firstName: string;
  /** Unread staff replies in support conversations. */
  unreadSupport: number;
  /** Proofs waiting for the customer's approval. */
  proofsAwaiting: number;
};

/** Cached per request: the top nav and the account side nav both use it. */
export const getNavAccount = cache(async (): Promise<NavAccount | null> => {
  const user = await getSessionUser();
  if (!user || !isEmailVerified(user)) return null;

  const [profile, proofsAwaiting, unreadSupport] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { firstName: true },
    }),
    countProofsAwaiting(user.id),
    countUnreadForCustomer(user.id),
  ]);

  return {
    firstName: profile?.firstName ?? "",
    unreadSupport,
    proofsAwaiting,
  };
});
