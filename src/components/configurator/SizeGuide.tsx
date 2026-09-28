"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MAX_SIZE_MM } from "@/lib/pricingUtils";

const TIPS = [
  "Sizes are measured against the longest side of your art.",
  "Icon images are examples of similar sized objects.",
  `Custom sizes can go up to ${Math.floor(MAX_SIZE_MM)}mm.`,
  "Presets assume max-size in any direction.",
  "Please use custom size if you know the exact dimensions of your sticker.",
];

/**
 * The blaze "Size guide" pill in the Size step header. Hovering shows the
 * fly-out on devices that can hover; tapping (or clicking / Enter) toggles it
 * so it also works on touch. Tapping outside or pressing Escape closes it.
 */
export function SizeGuide() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="group relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="rounded-full border-[1.5px] border-blaze-deep bg-blaze px-3 py-1.5 text-[11px] font-bold text-sand shadow-[2px_2px_0_0_var(--color-blaze-deep)] transition-[translate] duration-150 motion-safe:hover:-translate-y-0.5"
      >
        Size guide ↗
      </button>
      <div
        id={panelId}
        role="tooltip"
        className={[
          "absolute right-0 top-full z-20 mt-2 w-[250px] rounded-[14px] border-[1.5px] border-grape bg-sand p-4 text-night shadow-pop-grape-soft before:absolute before:inset-x-0 before:-top-2.5 before:h-2.5 transition-[opacity,visibility,translate] duration-150",
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100",
        ].join(" ")}
      >
        <ul className="list-disc space-y-1.5 pl-4 text-xs leading-snug marker:text-blaze">
          {TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
