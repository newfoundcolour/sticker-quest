import type { ReactNode } from "react";
import { AccountSideNav } from "@/components/account/AccountSideNav";
import { Container } from "@/components/Container";
import { requireVerifiedUser } from "@/lib/auth";
import { getNavAccount } from "@/lib/navAccount";

/**
 * Shell for every /account page: the Figma account sidebar flush left, the
 * page beside it. The check here keeps the shell itself private, but layouts
 * don't guard pages or server actions on their own — each page and action
 * calls requireVerifiedUser() too.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireVerifiedUser("/account");
  const account = await getNavAccount();

  return (
    <main className="relative isolate flex flex-1 flex-col bg-night">
      {/* Same width and gutters as the header and footer, so the sidebar lines up with the logo. */}
      <Container className="flex flex-1 flex-col lg:flex-row">
        <AccountSideNav
          firstName={account?.firstName ?? ""}
          lastName={account?.lastName ?? ""}
          email={account?.email ?? ""}
          proofsAwaiting={account?.proofsAwaiting ?? 0}
          unreadSupport={account?.unreadSupport ?? 0}
        />
        <div className="min-w-0 flex-1 pb-10 lg:w-3/4 lg:flex-none pt-6 sm:pt-8 lg:pl-7">{children}</div>
      </Container>
      <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -z-10 h-0">
        <div className="page-glow-left absolute bottom-0 left-0 h-[85vh] w-[70%]" />
        <div className="page-glow-right absolute bottom-0 right-0 h-[85vh] w-[70%]" />
      </div>
    </main>
  );
}
