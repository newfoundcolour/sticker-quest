import type { ReactNode } from "react";
import { Container } from "@/components/Container";
import { StepCard } from "@/components/configurator/StepCard";

/** Simple long-form text page on the night shell (Terms, Privacy). */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col bg-night">
      <Container className="flex justify-center py-12 sm:py-20">
        <div className="w-full max-w-[760px]">
          <StepCard icon="📜" title={title}>
            <div className="flex flex-col gap-5 p-6 text-sm leading-relaxed text-ink sm:p-8 [&_h2]:text-base [&_h2]:font-black [&_h2]:text-night">
              <p className="rounded-xl border-[1.5px] border-blaze bg-blaze/10 px-4 py-3 font-bold text-night">
                Placeholder: this page will be replaced with the final, legally reviewed version
                before launch.
              </p>
              <p className="text-quiet">Last updated {updated}</p>
              {children}
            </div>
          </StepCard>
        </div>
      </Container>
    </main>
  );
}
