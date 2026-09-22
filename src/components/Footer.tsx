import Image from "next/image";
import { Container } from "@/components/Container";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.13] bg-night">
      <Container className="flex flex-col items-center justify-center gap-3 py-6 text-center sm:h-[112px] sm:flex-row sm:justify-between sm:py-0 sm:text-left">
        <Image
          src="/brand/logo-sticker-quest.png"
          alt="Sticker Quest"
          width={68}
          height={40}
          className="h-8 w-auto sm:h-10"
        />
        <p className="text-xs text-white/45">© 2026 StickerQuest Inc. · All rights reserved.</p>
        {/* Plain text until the Privacy / Terms / Contact pages exist. */}
        <div className="flex gap-5 text-xs font-bold text-white/55 sm:gap-7">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>
      </Container>
    </footer>
  );
}
