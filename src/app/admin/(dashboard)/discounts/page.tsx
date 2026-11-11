import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { describeDiscount, discountLifecycle } from "@/lib/discounts";
import { formatCurrency } from "@/lib/pricingUtils";
import {
  AdminIcon,
  AdminPageHeader,
  AdminTabs,
  CARD_CLASSES,
  DiscountStatusBadge,
  EmptyMessage,
  PRIMARY_BUTTON,
  formatAdminDate,
  type DiscountLifecycleStatus,
} from "@/components/admin/ui";

const FILTERS = {
  active: { label: "Active", statuses: ["ACTIVE"] },
  scheduled: { label: "Scheduled", statuses: ["SCHEDULED"] },
  ended: { label: "Ended", statuses: ["EXPIRED", "USED_UP"] },
  off: { label: "Off", statuses: ["DISABLED"] },
} as const satisfies Record<string, { label: string; statuses: readonly DiscountLifecycleStatus[] }>;
type FilterKey = keyof typeof FILTERS;

function isFilter(v: string | undefined): v is FilterKey {
  return !!v && v in FILTERS;
}

function dateRange(startsAt: Date | null, endsAt: Date | null): string {
  if (!startsAt && !endsAt) return "No end date";
  if (startsAt && endsAt) return `${formatAdminDate(startsAt)} – ${formatAdminDate(endsAt)}`;
  return startsAt ? `From ${formatAdminDate(startsAt)}` : `Until ${formatAdminDate(endsAt!)}`;
}

export default async function AdminDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; deleted?: string }>;
}) {
  await requireStaff();
  const { show, deleted } = await searchParams;
  const filter = isFilter(show) ? show : undefined;

  // Staff-made codes stay few, so they're filtered in memory by their live status.
  const codes = await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });
  const now = new Date();
  const rows = codes.map((c) => ({ ...c, uses: c._count.orders, status: discountLifecycle(c, c._count.orders, now) }));
  const countFor = (key: FilterKey) =>
    rows.filter((r) => (FILTERS[key].statuses as readonly DiscountLifecycleStatus[]).includes(r.status)).length;
  const shown = filter
    ? rows.filter((r) => (FILTERS[filter].statuses as readonly DiscountLifecycleStatus[]).includes(r.status))
    : rows;

  return (
    <>
      <AdminPageHeader
        title="Discounts"
        description="Codes customers can enter in their cart. They come off the stickers, never the shipping."
        actions={
          <Link href="/admin/discounts/new" className={PRIMARY_BUTTON}>
            <AdminIcon name="plus" className="size-4" />
            New code
          </Link>
        }
      />

      {deleted && (
        <p role="status" className="mb-4 rounded-lg bg-trail-teal/10 px-3 py-2 text-sm font-medium text-admin-ink">
          Code deleted.
        </p>
      )}

      <section className={`${CARD_CLASSES} overflow-hidden`}>
        <AdminTabs
          label="Filter by status"
          tabs={[
            { href: "/admin/discounts", label: "All", count: rows.length, active: !filter },
            ...(Object.keys(FILTERS) as FilterKey[]).map((key) => ({
              href: `/admin/discounts?show=${key}`,
              label: FILTERS[key].label,
              count: countFor(key),
              active: filter === key,
            })),
          ]}
        />

        {shown.length === 0 ? (
          <EmptyMessage>
            {rows.length === 0 ? (
              <>
                No discount codes yet.{" "}
                <Link href="/admin/discounts/new" className="font-medium text-grape hover:underline">
                  Create the first one
                </Link>
                .
              </>
            ) : (
              "No codes here."
            )}
          </EmptyMessage>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line bg-admin-canvas/60 text-xs font-medium text-admin-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Code</th>
                  <th scope="col" className="px-5 py-3 font-medium">Discount</th>
                  <th scope="col" className="px-5 py-3 font-medium">Conditions</th>
                  <th scope="col" className="px-5 py-3 font-medium">Dates</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Uses</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="w-12 px-5 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-line">
                {shown.map((c) => {
                  const href = `/admin/discounts/${c.id}`;
                  const conditions = [
                    c.minOrderTotal !== null && Number(c.minOrderTotal) > 0 && `Min ${formatCurrency(Number(c.minOrderTotal))}`,
                    c.oncePerCustomer && "Once per customer",
                  ].filter(Boolean);
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-admin-canvas/60">
                      <td className="px-5 py-3.5">
                        <Link href={href} className="flex flex-col gap-0.5">
                          <span className="font-mono text-[13px] font-semibold text-admin-ink">{c.code}</span>
                          {c.description && <span className="max-w-[220px] truncate text-xs text-admin-muted">{c.description}</span>}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-admin-ink">{describeDiscount(c)}</td>
                      <td className="px-5 py-3.5 text-admin-muted">{conditions.length > 0 ? conditions.join(" · ") : "None"}</td>
                      <td className="px-5 py-3.5 text-admin-muted">{dateRange(c.startsAt, c.endsAt)}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-admin-ink">
                        {c.uses.toLocaleString("en-ZA")}
                        <span className="text-admin-faint"> / {c.maxUses === null ? "∞" : c.maxUses.toLocaleString("en-ZA")}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <DiscountStatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={href}
                          aria-label={`Open ${c.code}`}
                          className="flex size-8 items-center justify-center rounded-lg text-admin-faint hover:bg-admin-canvas hover:text-admin-ink"
                        >
                          <AdminIcon name="chevron-right" className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
