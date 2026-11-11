import type { ReactNode } from "react";
import { ORDER_TABLE_CARD_CLASSES } from "@/components/account/OrderRows";

/** The lime pill used for an account page's main action (Figma "New order"). */
export const ACCOUNT_ACTION_CLASSES =
  "inline-flex h-[42px] items-center gap-2 rounded-full bg-zap px-5 text-[13px] font-semibold whitespace-nowrap text-night transition-transform hover:-translate-y-px";

/** A smaller lime pill for an action on a row (Figma "Review proof"). */
export const ROW_ACTION_CLASSES =
  "inline-flex h-8 shrink-0 items-center rounded-full bg-zap px-3 text-xs font-semibold whitespace-nowrap text-night transition-transform hover:-translate-y-px";

/** Rows inside an AccountCard: thin dividers, a soft hover. */
export const CARD_LIST_CLASSES = "divide-y divide-white/[0.06] border-t border-white/[0.06]";
export const CARD_ROW_HOVER_CLASSES = "transition-colors hover:bg-white/[0.03]";

/**
 * A dark dusk card with a title row, like "Your orders" on the Orders page.
 * Put rows in a `CARD_LIST_CLASSES` list, or pad the body yourself.
 */
export function AccountCard({
  title,
  description,
  action,
  className = "",
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${ORDER_TABLE_CARD_CLASSES} ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline text-[22px] font-bold text-sand">{title}</h2>
          {description && <p className="text-[13px] text-white/[0.38]">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
