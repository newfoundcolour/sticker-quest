import { formatCurrency } from "@/lib/pricingUtils";
import type { OrderStats } from "@/lib/orderStats";

/** Single-use, tightly coupled to this row — kept local rather than added to src/components/icons. */
function iconProps() {
  return {
    viewBox: "0 0 24 24",
    className: "h-4 w-4",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function OrdersIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M9 10h6M9 13h6M9 16h3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.3l2.4 2.4 4.6-5.4" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M7 8V4h10v4" />
      <rect x="4.5" y="8" width="15" height="7" rx="1.5" />
      <rect x="7.5" y="13" width="9" height="6.5" rx="1" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="2.5" y="8" width="11" height="8" rx="1" />
      <path d="M13.5 11h3.5l3 3v2h-6.5z" />
      <circle cx="7" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 15.5V8.5h2.7a1.9 1.9 0 0 1 0 3.8H9.5M9.5 12.3h3.3" />
    </svg>
  );
}

function AverageIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M5 18V13M10.5 18V10M16 18V6" />
    </svg>
  );
}

function TrendBadge({ percent }: { percent: number | null }) {
  if (percent === null) return null;
  const isUp = percent >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[11px] font-medium ${
        isUp ? "bg-trail-teal/15 text-trail-teal" : "bg-ink-navy/10 text-ink-navy/60"
      }`}
    >
      {isUp ? "▲" : "▼"} {Math.abs(percent)}%
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: number | null;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink-navy/10 bg-white/70 p-4">
      <div className="flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-navy/5 text-ink-navy/70">
          {icon}
        </span>
        {trend !== undefined && <TrendBadge percent={trend} />}
      </div>
      <div>
        <p className="font-mono text-xl font-semibold text-ink-navy">{value}</p>
        <p className="text-xs uppercase tracking-wide text-ink-navy/50">{label}</p>
      </div>
    </div>
  );
}

/** The "Quick Stats" row from DESIGN.md — Admin Dashboard UI Inspiration. */
export function QuickStats({ stats }: { stats: OrderStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      <StatCard
        label="Total Orders"
        value={stats.totalOrders.toLocaleString("en-ZA")}
        icon={<OrdersIcon />}
      />
      <StatCard
        label="Awaiting Proof"
        value={stats.awaitingProof.toLocaleString("en-ZA")}
        icon={<ClockIcon />}
      />
      <StatCard
        label="Approved"
        value={stats.approved.toLocaleString("en-ZA")}
        icon={<CheckIcon />}
      />
      <StatCard
        label="Printing"
        value={stats.printing.toLocaleString("en-ZA")}
        icon={<PrinterIcon />}
      />
      <StatCard
        label="Shipped Today"
        value={stats.shippedToday.toLocaleString("en-ZA")}
        icon={<TruckIcon />}
        trend={stats.shippedTodayTrendPercent}
      />
      <StatCard
        label="Revenue Today"
        value={formatCurrency(stats.revenueToday)}
        icon={<RevenueIcon />}
        trend={stats.revenueTodayTrendPercent}
      />
      <StatCard
        label="Avg Order Value"
        value={formatCurrency(stats.averageOrderValue)}
        icon={<AverageIcon />}
      />
    </div>
  );
}
