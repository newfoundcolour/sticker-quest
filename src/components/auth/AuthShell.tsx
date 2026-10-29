import type { ReactNode } from "react";
import { Container } from "@/components/Container";

/**
 * Page frame for the auth pages (log in, sign up, forgot and reset password):
 * the night page with its grape glows. `narrow` is the single 688px column;
 * otherwise content can span up to 1296px (sign up's two columns).
 */
export function NightAuthPage({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <main className="relative isolate flex flex-1 flex-col bg-night">
      <Container className="pb-14 pt-6 sm:pt-9">
        <div className={narrow ? "mx-auto w-full max-w-[688px] py-3" : "mx-auto w-full max-w-[1296px]"}>
          {children}
        </div>
      </Container>
      <PageGlow />
    </main>
  );
}

function PageGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -z-10 h-0">
      <div className="page-glow-left absolute bottom-0 left-0 h-[85vh] w-[70%]" />
      <div className="page-glow-right absolute bottom-0 right-0 h-[85vh] w-[70%]" />
    </div>
  );
}

