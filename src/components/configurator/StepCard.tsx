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
  blaze: "border-blaze bg-blaze text-white",
  grape: "border-grape bg-grape text-white",
  zap: "border-zap bg-zap text-ink",
} as const;

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
        "flex flex-col items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-40",
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
