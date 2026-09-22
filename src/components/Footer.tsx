import Image from "next/image";

export function Footer() {
  return (
    <footer className="flex flex-col items-center justify-center gap-3 border-t border-white/[0.13] bg-night px-6 py-6 text-center sm:h-[112px] sm:flex-row sm:justify-between sm:px-10 sm:py-0 sm:text-left md:px-14 lg:px-20 xl:px-24">
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
    </footer>
  );
}
