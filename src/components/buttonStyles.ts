/**
 * Shared button looks. Kept out of "use client" files so server components
 * can use them too (importing a value from a client module gives a reference,
 * not the string).
 */

/** The lime pill with a grape underside (Figma: "Create account", "Proceed to payment"). Add a width. */
export const ZAP_BUTTON_CLASSES = [
  "flex h-14 items-center justify-center gap-3 rounded-full bg-zap px-6 text-base font-black text-night",
  "shadow-[0_4px_0_0_var(--color-grape)] transition-[translate,box-shadow] duration-150",
  "motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_6px_0_0_var(--color-grape)]",
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zap",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");
