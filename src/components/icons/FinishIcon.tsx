"use client";

import { useId } from "react";
import type { Finish } from "@/generated/prisma/client";

export function FinishIcon({ finish, className }: { finish: Finish; className?: string }) {
  const uid = useId();
  const gradId = `finish-gloss${uid}`;

  return (
    <svg viewBox="0 0 48 48" className={className}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="66%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="36" height="36" rx="7" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.5" />
      {finish === "GLOSS" && <rect x="6" y="6" width="36" height="36" rx="7" fill={`url(#${gradId})`} />}
    </svg>
  );
}
