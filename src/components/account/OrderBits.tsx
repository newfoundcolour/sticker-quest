import Image from "next/image";
import type { ReactNode } from "react";
import { WaypointLine } from "@/components/configurator/WaypointLine";
import {
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VALUES,
} from "@/lib/orderLabels";
import type { OrderStatus } from "@/generated/prisma/client";

/** Same status pill vocabulary as the admin (DESIGN.md → Status pills). */
export function StatusPill({ status, size = "sm" }: { status: OrderStatus; size?: "sm" | "md" }) {
  return (
    <span
      className={[
        "inline-flex whitespace-nowrap rounded-full font-black",
        size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
        ORDER_STATUS_BADGE_CLASSES[status],
      ].join(" ")}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

const STATUS_STEPS = ORDER_STATUS_VALUES.map((s) => ({ key: s, label: ORDER_STATUS_LABELS[s] }));

/**
 * The order-tracking Waypoint Line from DESIGN.md: one dot per pipeline
 * stage, the mascot standing on the current one.
 */
export function OrderProgress({ status }: { status: OrderStatus }) {
  const current = ORDER_STATUS_VALUES.indexOf(status);
  const done = status === "SHIPPED";
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[360px] [&_span]:text-xs sm:[&_span]:text-sm">
        <WaypointLine
          steps={STATUS_STEPS}
          completed={STATUS_STEPS.map((_, i) => i < current || done)}
          activeIndex={current}
        />
      </div>
      <p className="sr-only">Current status: {ORDER_STATUS_LABELS[status]}</p>
    </div>
  );
}

/** A number card for the Orders page summary row, on the dark dusk surface. */
export function MetricCard({
  label,
  value,
  note,
  icon,
  highlight = false,
}: {
  label: string;
  value: ReactNode;
  note: string;
  /** Path of an 18px icon in /public. */
  icon: string;
  /** Lime icon tile, for the metric that needs attention. */
  highlight?: boolean;
}) {
  return (
    <div className="flex min-h-[110px] items-center justify-between gap-3 rounded-[20px] border-[1.5px] border-dusk-line bg-dusk p-5 shadow-[0_4px_12px_rgba(0,0,0,0.28)]">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-xs font-medium text-dusk-note">{label}</p>
        <p className="flex flex-wrap items-baseline gap-x-2.5">
          <span className="text-[32px] font-bold leading-none tracking-[-1px] text-sand">{value}</span>
          <span className="text-[11px] text-white/[0.31]">{note}</span>
        </p>
      </div>
      <span
        aria-hidden
        className={`flex size-9 shrink-0 items-center justify-center rounded-[8px] ${highlight ? "bg-zap" : "bg-white/[0.08]"}`}
      >
        <Image src={icon} alt="" width={18} height={18} />
      </span>
    </div>
  );
}

const STATUS_CHIP_STYLES: Record<OrderStatus, { chip: string; dot: string }> = {
  AWAITING_PROOF: { chip: "border-grape/[0.38] bg-grape/[0.13] text-dusk-note", dot: "/icons/orders/dot-grape.svg" },
  AWAITING_APPROVAL: { chip: "border-blaze/[0.38] bg-blaze/[0.13] text-blaze", dot: "/icons/orders/dot-blaze.svg" },
  APPROVED: { chip: "border-white/[0.13] bg-white/[0.06] text-dusk-note", dot: "/icons/orders/dot-grape.svg" },
  PRINTING: { chip: "border-zap/[0.38] bg-zap/[0.13] text-zap", dot: "/icons/orders/dot-zap.svg" },
  SHIPPED: { chip: "border-leaf/[0.38] bg-leaf/[0.13] text-leaf", dot: "/icons/orders/dot-leaf.svg" },
};

/** The status pill for dark surfaces (customer Orders page), with a coloured dot. */
export function StatusChip({ status }: { status: OrderStatus }) {
  const style = STATUS_CHIP_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-[9px] py-[5px] text-xs font-medium ${style.chip}`}
    >
      <Image src={style.dot} alt="" width={5} height={5} />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function formatOrderDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

/** Empty state: a heading, a line of copy and an optional action. No image. */
export function EmptyState({
  title,
  children,
  action,
  dark = false,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  /** Light text, for a dusk card. */
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <p className={`text-lg font-black ${dark ? "text-sand" : "text-night"}`}>{title}</p>
      {children && (
        <p className={`max-w-sm text-sm leading-relaxed ${dark ? "text-white/[0.44]" : "text-ink"}`}>{children}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
