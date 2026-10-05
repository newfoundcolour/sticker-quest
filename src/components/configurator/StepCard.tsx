import type { ReactNode } from "react";

/**
 * A step's card: cream body, thick grape border, a solid grape header bar
 * with a lime step badge. Every step uses the same colours now — only the
 * step number changes.
 */
export function StepCard({
  step,
  mobileStep,
  icon,
  title,
  description,
  action,
  className = "",
  children,
}: {
  /** Leave out for an unnumbered section (e.g. a sticker sheet's cut count). */
  step?: number;
  /** Number shown below `md`, for cards that are reordered there. Defaults to `step`. */
  mobileStep?: number;
  /** Shown left of the title, e.g. an emoji for an unnumbered section. */
  icon?: ReactNode;
  title: string;
  /** A short line beside the title (wraps under it on narrow screens). */
  description?: string;
  /** Extra control on the right of the header bar (e.g. the size guide). */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={[
        "flex flex-col overflow-hidden rounded-[20px] border-[1.5px] border-grape bg-sand",
        className,
      ].join(" ")}
    >
      <div className="flex min-h-[60px] shrink-0 items-center gap-2.5 bg-grape px-[18px] py-2 shadow-pop-grape-soft">
        {step !== undefined && (
          <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-night bg-zap text-xs font-black text-night">
            {mobileStep === undefined ? (
              step
            ) : (
              <>
                <span className="md:hidden">{mobileStep}</span>
                <span className="max-md:hidden">{step}</span>
              </>
            )}
          </span>
        )}
        {icon && (
          <span aria-hidden className="text-xl leading-none drop-shadow-[1.5px_1.5px_0_rgba(22,18,42,0.4)]">
            {icon}
          </span>
        )}
        {description ? (
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 className="text-lg font-black text-white">{title}</h2>
            <p className="text-sm text-white/75">{description}</p>
          </div>
        ) : (
          <h2 className="text-lg font-black text-white">{title}</h2>
        )}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}

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

/**
 * Cream and grape-bordered when idle, lime with an olive hard shadow when
 * chosen — every step shares this one look now. Exported so hand-rolled
 * controls (cut-mode buttons, quantity rows) that don't fit OptionTile's
 * shape can reuse the same colours.
 */
export const SELECTED_CLASSES = "border-[#595c10] bg-zap text-night shadow-pop-zap";
export const IDLE_CLASSES = "border-grape bg-sand text-night hover:border-night/40";

/** A selectable tile — every step now shares one selected look (lime + hard shadow). */
export function OptionTile({
  selected,
  onClick,
  disabled,
  className = "",
  children,
}: {
  selected: boolean;
  onClick: () => void;
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
        "group flex flex-col items-center justify-center rounded-[14px] border disabled:cursor-not-allowed disabled:opacity-40",
        OPTION_TRANSITION,
        LIFT_ON_HOVER,
        selected ? SELECTED_CLASSES : IDLE_CLASSES,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
