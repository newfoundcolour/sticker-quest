"use client";

import { useId } from "react";
import type { StickerType } from "@/generated/prisma/client";

export function MaterialIcon({
  material,
  className,
}: {
  material: StickerType;
  className?: string;
}) {
  const uid = useId();
  const swatch = (x: string) => `${x}${uid}`;

  return (
    <svg viewBox="0 0 48 48" className={className}>
      <defs>
        <linearGradient id={swatch("holo")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8bd0" />
          <stop offset="30%" stopColor="#ffe08b" />
          <stop offset="55%" stopColor="#8bffc1" />
          <stop offset="80%" stopColor="#8bd0ff" />
          <stop offset="100%" stopColor="#c58bff" />
        </linearGradient>
        <linearGradient id={swatch("chrome")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dfe4ea" />
          <stop offset="45%" stopColor="#8f99a8" />
          <stop offset="55%" stopColor="#f4f6f8" />
          <stop offset="100%" stopColor="#6b7684" />
        </linearGradient>
        <linearGradient id={swatch("gloss")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect
        x="6"
        y="6"
        width="36"
        height="36"
        rx="7"
        fill={materialFill(material, swatch)}
        stroke="currentColor"
        strokeOpacity={material === "CLEAR" ? 0.5 : 0}
        strokeDasharray={material === "CLEAR" ? "3 3" : undefined}
      />

      {material === "CHROME" && (
        <rect x="6" y="6" width="36" height="36" rx="7" fill={`url(#${swatch("gloss")})`} />
      )}

      {material === "ECONOMY" && (
        <rect x="6" y="6" width="36" height="36" rx="7" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      )}

      {material === "STICKER_SHEETS" && <MiniGrid variant="circles" />}
      {material === "LABEL_SHEETS" && <MiniGrid variant="rects" />}
    </svg>
  );
}

function materialFill(material: StickerType, swatch: (x: string) => string): string {
  switch (material) {
    case "VINYL":
      return "#ff5a3c";
    case "HOLOGRAPHIC":
      return `url(#${swatch("holo")})`;
    case "CHROME":
      return `url(#${swatch("chrome")})`;
    case "CLEAR":
      return "#faf9f6";
    case "ECONOMY":
      return "#e4e0d8";
    case "STICKER_SHEETS":
    case "LABEL_SHEETS":
      return "#faf9f6";
  }
}

function MiniGrid({ variant }: { variant: "circles" | "rects" }) {
  const positions = [
    [14, 16],
    [24, 16],
    [34, 16],
    [14, 24],
    [24, 24],
    [34, 24],
    [14, 32],
    [24, 32],
    [34, 32],
  ] as const;
  return (
    <>
      {positions.map(([cx, cy], i) =>
        variant === "circles" ? (
          <circle key={i} cx={cx} cy={cy} r={2.6} fill="currentColor" fillOpacity={0.75} />
        ) : (
          <rect
            key={i}
            x={cx - 3.4}
            y={cy - 2.2}
            width={6.8}
            height={4.4}
            rx={1}
            fill="currentColor"
            fillOpacity={0.75}
          />
        ),
      )}
    </>
  );
}
