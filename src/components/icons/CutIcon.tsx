import type { CutType } from "@/generated/prisma/client";

export function CutIcon({ cut, className }: { cut: CutType; className?: string }) {
  if (cut === "KISS") {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        {/* backing sheet stays intact */}
        <rect x="6" y="6" width="36" height="36" rx="4" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
        {/* only the sticker shape is cut, through the top layer */}
        <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" className={className} fill="none">
      {/* cut all the way through — no backing margin left */}
      <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
