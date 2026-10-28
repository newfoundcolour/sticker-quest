import type { ReactNode } from "react";
import { WaypointLine } from "@/components/configurator/WaypointLine";
import { Mascot } from "@/components/configurator/Mascot";
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

/** A small number card for the Orders page stats row. */
export function StatCard({ label, value, icon }: { label: string; value: ReactNode; icon: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border-[1.5px] border-grape bg-sand px-5 py-4">
      <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-grape/15 text-xl">
        {icon}
      </span>
      <div>
        <p className="text-[26px] font-black leading-none text-night">{value}</p>
        <p className="mt-1 text-xs font-black uppercase tracking-wide text-quiet">{label}</p>
      </div>
    </div>
  );
}

export function formatOrderDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

/** On-brand empty state with the mascot. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <MascotBadge />
      <p className="text-lg font-black text-night">{title}</p>
      {children && <p className="max-w-sm text-sm leading-relaxed text-ink">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function MascotBadge() {
  return <Mascot className="size-16 drop-shadow-sm" />;
}
