import type { ReactNode } from "react";

// Badge colours follow the Figma: orange, purple, lime, orange, purple.
const BADGE_TONES = [
  "bg-blaze text-white",
  "bg-grape text-white",
  "bg-zap text-ink",
  "bg-blaze text-white",
  "bg-grape text-white",
];

export function StepCard({
  step,
  title,
  className = "",
  children,
}: {
  step: number;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={[
        "flex flex-col overflow-hidden rounded-[20px] bg-white shadow-card",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-2.5 border-b border-ink/[0.09] px-5 py-4">
        <span
          className={[
            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-black",
            BADGE_TONES[(step - 1) % BADGE_TONES.length],
          ].join(" ")}
        >
          {step}
        </span>
        <h2 className="text-base font-black text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

const SELECTED_TONES = {
  blaze: "border-blaze bg-blaze text-white shadow-pop-blaze",
  grape: "border-grape bg-grape text-white shadow-pop-grape",
  zap: "border-zap bg-zap text-ink shadow-pop-zap",
} as const;

/** Every option lifts a couple of pixels on hover (skipped for reduced motion). */
export const LIFT_ON_HOVER = "enabled:motion-safe:hover:-translate-y-0.5";

/** The same lift for things that aren't buttons (e.g. a checkbox label). */
export const LIFT_ON_HOVER_ANY =
  "transition-[translate] duration-150 motion-safe:hover:-translate-y-0.5";

/**
 * For an image inside a `group` tile: pivots clockwise about its bottom-right
 * corner, so the top-left corner swings up and to the right.
 */
export const TILT_ON_HOVER =
  "origin-bottom-right transition-transform duration-200 motion-safe:group-hover:rotate-[5deg]";

/** Transition set shared by everything that lifts, recolours or gains a shadow. */
export const OPTION_TRANSITION =
  "transition-[color,background-color,border-color,box-shadow,translate] duration-150";

/** A selectable tile — grey when idle, filled with the step's accent when chosen. */
export function OptionTile({
  selected,
  onClick,
  tone,
  disabled,
  className = "",
  children,
}: {
  selected: boolean;
  onClick: () => void;
  tone: keyof typeof SELECTED_TONES;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      disabled={disabled}
      className={[
        "group flex flex-col items-center justify-center rounded-xl border disabled:cursor-not-allowed disabled:opacity-40",
        OPTION_TRANSITION,
        LIFT_ON_HOVER,
        selected
          ? SELECTED_TONES[tone]
          : "border-transparent bg-mist text-quiet hover:border-ink/20",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
