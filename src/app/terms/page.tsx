import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms · Sticker Quest" };

// TODO: replace with the final terms before launch.
export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="28 October 2026">
      <section>
        <h2>Ordering</h2>
        <p>
          You pay upfront at checkout. We check your artwork and send you a proof to approve before
          anything is printed.
        </p>
      </section>
      <section>
        <h2>Proofs and printing</h2>
        <p>
          We print exactly what you approve, so please check spelling, colours and sizes carefully.
          Once a proof is approved, your order is printed and dispatched the next business day.
        </p>
      </section>
      <section>
        <h2>Your artwork</h2>
        <p>
          You confirm you own, or have permission to use, the artwork you upload. We only use it to
          make your order.
        </p>
      </section>
      <section>
        <h2>Your account</h2>
        <p>
          Keep your login details private. You&apos;re responsible for orders placed from your
          account.
        </p>
      </section>
    </LegalPage>
  );
}
