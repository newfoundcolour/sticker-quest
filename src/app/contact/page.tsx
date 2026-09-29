import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Contact us · Sticker Quest" };

// Placeholder until the contact form is built.
export default function ContactPage() {
  return (
    <ComingSoon
      title="Contact us"
      blurb="Our contact form is coming soon. We're in Monday to Friday, 8am to 5pm."
    />
  );
}
