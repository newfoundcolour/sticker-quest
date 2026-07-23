import type { ReactNode } from "react";

export function StepCard({
  title,
  description,
  done,
  children,
}: {
  title: string;
  description?: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-navy/10 bg-white/70 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink-navy">{title}</h3>
        {done && (
          <span className="flex items-center gap-1 text-sm font-medium text-trail-teal">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10.5l4 4 8-9" />
            </svg>
            Selected
          </span>
        )}
      </div>
      {description && <p className="mb-4 text-sm text-ink-navy/60">{description}</p>}
      {children}
    </section>
  );
}

export function ChoiceChip({
  selected,
  onClick,
  label,
  hint,
  sublabel,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  /** Neutral descriptive subtext, e.g. "Through the backing". */
  hint?: string;
  /** Positive-styled subtext, e.g. a savings badge. */
  sublabel?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "flex min-w-[92px] flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-colors",
        selected
          ? "border-coral-signal bg-coral-signal/5"
          : "border-ink-navy/10 hover:border-ink-navy/30",
      ].join(" ")}
    >
      <span className="h-12 w-12 text-ink-navy">{children}</span>
      <span className="text-xs font-medium text-ink-navy/80">{label}</span>
      {hint && <span className="text-[11px] text-ink-navy/45">{hint}</span>}
      {sublabel && <span className="text-[11px] text-trail-teal font-semibold">{sublabel}</span>}
    </button>
  );
}
