import type { ReactNode } from "react";

/**
 * A step's card. The default "sand" tone (account pages) has a cream body, a
 * grape border and a solid grape header bar with a lime step badge. The
 * "dusk" tone (configurator) is one dark card with a grape step badge.
 */
export function StepCard({
  step,
  mobileStep,
  icon,
  title,
  description,
  action,
  tone = "sand",
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
  tone?: "sand" | "dusk";
  className?: string;
  children: ReactNode;
}) {
  const dusk = tone === "dusk";
  const titleColour = dusk ? "text-sand" : "text-white";
  return (
    <section
      className={[
        "flex flex-col overflow-hidden rounded-[20px]",
        dusk ? "bg-dusk" : "border-[1.5px] border-grape bg-sand",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "flex shrink-0 items-center gap-2.5 px-[18px]",
          // Dusk: a tight header, pulled 12px into the body's top padding so the
          // options sit close under the title.
          dusk ? "-mb-3 pt-[18px]" : "min-h-[60px] bg-grape py-2 shadow-pop-grape-soft",
        ].join(" ")}
      >
        {step !== undefined && (
          <span
            className={[
              "flex size-[30px] shrink-0 items-center justify-center rounded-full text-xs font-black",
              dusk ? "bg-grape text-sand" : "border-[1.5px] border-night bg-zap text-night",
            ].join(" ")}
          >
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
            <h2 className={`text-lg font-black ${titleColour}`}>{title}</h2>
            <p className={`text-sm opacity-75 ${titleColour}`}>{description}</p>
          </div>
        ) : (
          <h2 className={`text-lg font-black ${titleColour}`}>{title}</h2>
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
 * Configurator options on dusk cards: a raised dark tile when idle, solid lime
 * when chosen. Exported so hand-rolled controls (cut-mode buttons, quantity
 * rows) that don't fit OptionTile's shape can reuse the same colours. Hover
 * only lifts the tile; there's no hover stroke.
 */
export const SELECTED_CLASSES = "border-transparent bg-zap text-night";
export const IDLE_CLASSES = "border-transparent bg-dusk-tile text-sand";
/** Small hint text under an option label. */
export const hintClass = (selected: boolean) => (selected ? "text-night" : "text-dusk-hint");

/** A selectable tile — every step shares one selected look (solid lime). */
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
