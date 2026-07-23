import type { Shape } from "@/generated/prisma/client";
import { SwordIcon } from "./SwordIcon";

export function ShapeIcon({ shape, className }: { shape: Shape; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.5,
  };

  switch (shape) {
    case "SQUARE":
      return (
        <svg {...common}>
          <rect x="10" y="10" width="28" height="28" rx="4" />
        </svg>
      );
    case "CIRCLE":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="15" />
        </svg>
      );
    case "RECTANGLE":
      return (
        <svg {...common}>
          <rect x="6" y="14" width="36" height="20" rx="4" />
        </svg>
      );
    case "OVAL":
      return (
        <svg {...common}>
          <ellipse cx="24" cy="24" rx="18" ry="12" />
        </svg>
      );
    case "CUSTOM":
      return <SwordIcon className={className} />;
  }
}
