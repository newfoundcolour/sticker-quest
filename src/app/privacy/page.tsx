import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · Sticker Quest" };

// TODO: replace with the final, POPIA-reviewed policy before launch.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="28 October 2026">
      <section>
        <h2>What we collect</h2>
        <p>
          Your name, email, phone number and delivery address, the artwork you upload, and the
          details of your orders and support messages.
        </p>
      </section>
      <section>
        <h2>Why we collect it</h2>
        <p>
          To make and deliver your stickers, send you proofs, answer your questions and, if you give
          us your Instagram handle, to tag you when we feature your order.
        </p>
      </section>
      <section>
        <h2>Who we share it with</h2>
        <p>
          Only the services we need to run the shop: payments (PayFast), delivery (The Courier Guy),
          and hosting and storage providers. We never sell your information.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          Under POPIA you can ask to see, correct or delete your personal information. Get in touch
          through our contact page.
        </p>
      </section>
    </LegalPage>
  );
}
