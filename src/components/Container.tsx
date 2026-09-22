import type { ReactNode } from "react";

/**
 * Site-wide width constraint: centers content at up to 1420px, going to
 * 100% width with side padding below that. Padding widens to 24px on
 * mobile (16px feels tight there) and settles to 16px from `sm` up.
 */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1420px] box-border px-6 sm:px-4 ${className}`}
    >
      {children}
    </div>
  );
}
