import type { ReactNode } from "react";
import { Container } from "@/components/Container";
import { AccountSideNav } from "@/components/account/AccountSideNav";
import { requireVerifiedUser } from "@/lib/auth";
import { getNavAccount } from "@/lib/navAccount";

/**
 * Shell for every /account page. The check here keeps the shell itself
 * private, but layouts don't guard pages or server actions on their own —
 * each page and action calls requireVerifiedUser() too.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireVerifiedUser("/account");
  const account = await getNavAccount();

  return (
    <main className="relative isolate flex flex-1 flex-col bg-night">
      <Container className="grid gap-6 py-8 sm:py-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <AccountSideNav
          proofsAwaiting={account?.proofsAwaiting ?? 0}
          unreadSupport={account?.unreadSupport ?? 0}
        />
        <div className="min-w-0">{children}</div>
      </Container>
      <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -z-10 h-0">
        <div className="page-glow-left absolute bottom-0 left-0 h-[85vh] w-[70%]" />
        <div className="page-glow-right absolute bottom-0 right-0 h-[85vh] w-[70%]" />
      </div>
    </main>
  );
}
