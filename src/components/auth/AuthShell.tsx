import type { ReactNode } from "react";
import { Container } from "@/components/Container";
import { StepCard } from "@/components/configurator/StepCard";

/**
 * Page frame for /login, /signup and the password pages: the Figma night
 * shell with one sand card (the configurator's StepCard) in the middle.
 */
export function AuthShell({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative isolate flex flex-1 flex-col bg-night">
      <Container className="flex justify-center py-12 sm:py-20">
        <div className="w-full max-w-[460px]">
          <StepCard icon="✦" title={title}>
            <div className="flex flex-col gap-5 p-6 sm:p-7">
              {intro && <div className="text-sm leading-relaxed text-ink">{intro}</div>}
              {children}
            </div>
          </StepCard>
          {footer && <div className="mt-6 text-center text-sm text-white/70">{footer}</div>}
        </div>
      </Container>
      <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -z-10 h-0">
        <div className="page-glow-left absolute bottom-0 left-0 h-[85vh] w-[70%]" />
        <div className="page-glow-right absolute bottom-0 right-0 h-[85vh] w-[70%]" />
      </div>
    </main>
  );
}

/** Inline link style for the white-on-night footer line and inside cards. */
export const AUTH_LINK_CLASSES = "font-black text-blaze underline-offset-2 hover:underline";
export const AUTH_LINK_ON_NIGHT_CLASSES = "font-black text-zap underline-offset-2 hover:underline";
