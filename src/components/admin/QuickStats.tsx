import Link from "next/link";
import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/pricingUtils";
import type { OrderStats } from "@/lib/orderStats";
import { AdminIcon, CARD_CLASSES, type AdminIconName } from "@/components/admin/ui";

/** Up = good news (teal); down stays neutral grey — a dip isn't an alarm on an internal card. */
function Trend({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="text-xs text-admin-faint">No data for yesterday</span>;
  const up = percent >= 0;
  return (
    <span className="text-xs text-admin-muted">
      <span className={`font-semibold ${up ? "text-trail-teal" : "text-admin-muted"}`}>
        {up ? "▲" : "▼"} {Math.abs(percent)}%
      </span>{" "}
      vs yesterday
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  footer,
  href,
}: {
  label: string;
  value: string;
  icon: AdminIconName;
  footer: ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-admin-muted">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-grape/10 text-grape">
          <AdminIcon name={icon} className="size-4" />
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-admin-ink tabular-nums">{value}</p>
      <div>{footer}</div>
    </>
  );
  const classes = `${CARD_CLASSES} flex flex-col gap-2 p-5`;
  return href ? (
    <Link href={href} className={`${classes} transition-colors hover:border-grape/40`}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

/**
 * Shop health at a glance, above the Orders table. The pipeline counts live on
 * the table's tabs, so this row only carries the business numbers.
 */
export function QuickStats({ stats }: { stats: OrderStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Revenue today"
        value={formatCurrency(stats.revenueToday)}
        icon="revenue"
        footer={<Trend percent={stats.revenueTodayTrendPercent} />}
      />
      <StatCard
        label="Shipped today"
        value={stats.shippedToday.toLocaleString("en-ZA")}
        icon="truck"
        footer={<Trend percent={stats.shippedTodayTrendPercent} />}
      />
      <StatCard
        label="Average order"
        value={formatCurrency(stats.averageOrderValue)}
        icon="average"
        footer={
          <span className="text-xs text-admin-muted">
            Across {stats.totalOrders.toLocaleString("en-ZA")} {stats.totalOrders === 1 ? "order" : "orders"}
          </span>
        }
      />
      <StatCard
        label="Open support"
        value={stats.openConversations.toLocaleString("en-ZA")}
        icon="message"
        href="/admin/support?status=OPEN"
        footer={<span className="text-xs font-medium text-grape">Go to inbox →</span>}
      />
    </div>
  );
}
