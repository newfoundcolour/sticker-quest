import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { StepCard } from "@/components/configurator/StepCard";
import { FormMessage, PRIMARY_BUTTON_CLASSES } from "@/components/auth/fields";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Your account · Sticker Quest" };

const NOTICES: Record<string, string> = {
  password: "Your password is updated, and any other devices have been signed out.",
  email: "Email change confirmed. If we asked you to confirm from both addresses, check the other inbox too.",
};

// Placeholder landing page until the full account area (Phase 2) replaces it.
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string; email?: string }>;
}) {
  const user = await requireVerifiedUser("/account");
  const { password, email } = await searchParams;
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { firstName: true },
  });
  const notice = password === "updated" ? NOTICES.password : email === "updated" ? NOTICES.email : undefined;

  return (
    <main className="flex flex-1 flex-col bg-night">
      <Container className="flex justify-center py-12 sm:py-20">
        <div className="w-full max-w-[560px]">
          <StepCard icon="👋" title={`Hey ${profile?.firstName || "there"}!`}>
            <div className="flex flex-col gap-5 p-6 sm:p-7">
              {notice && <FormMessage tone="success">{notice}</FormMessage>}
              <p className="text-sm leading-relaxed text-ink">
                You&apos;re logged in. Your dashboard for orders, proofs, reorders and support is
                being built and lands here soon.
              </p>
              <Link href="/stickers" className={`${PRIMARY_BUTTON_CLASSES} text-center`}>
                Make some stickers
              </Link>
            </div>
          </StepCard>
        </div>
      </Container>
    </main>
  );
}
