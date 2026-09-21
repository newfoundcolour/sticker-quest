import Image from "next/image";

export function Footer() {
  return (
    <footer className="flex items-center justify-between bg-night px-10 py-7">
      <Image
        src="/brand/logo-sticker-quest.png"
        alt="Sticker Quest"
        width={54}
        height={32}
        className="h-8 w-auto"
      />
      <p className="text-xs text-white/45">© 2026 StickerQuest Inc. · All rights reserved.</p>
      {/* Plain text until the Privacy / Terms / Contact pages exist. */}
      <div className="flex gap-4 text-xs font-semibold text-white/50">
        <span>Privacy</span>
        <span>Terms</span>
        <span>Contact</span>
      </div>
    </footer>
  );
}
