import type { Metadata } from "next";
import Link from "next/link";
import { StepCard } from "@/components/configurator/StepCard";
import { FormMessage, PRIMARY_BUTTON_CLASSES } from "@/components/auth/fields";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard · Sticker Quest" };

const NOTICES: Record<string, string> = {
  password: "Your password is updated, and any other devices have been signed out.",
};

// Placeholder until the dashboard (Phase 3) replaces it.
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string }>;
}) {
  const user = await requireVerifiedUser("/account");
  const { password } = await searchParams;
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { firstName: true },
  });
  const notice = password === "updated" ? NOTICES.password : undefined;

  return (
    <>
      <AccountPageHeader title={`Hey ${profile?.firstName || "there"}!`} />
      <div className="max-w-[560px]">
        <StepCard icon="👋" title="Your dashboard">
          <div className="flex flex-col gap-5 p-6 sm:p-7">
            {notice && <FormMessage tone="success">{notice}</FormMessage>}
            <p className="text-sm leading-relaxed text-ink">
              Your orders, proofs, reorders and support messages will all live here. They&apos;re
              on their way!
            </p>
            <Link href="/stickers" className={`${PRIMARY_BUTTON_CLASSES} text-center`}>
              Make some stickers
            </Link>
          </div>
        </StepCard>
      </div>
    </>
  );
}
