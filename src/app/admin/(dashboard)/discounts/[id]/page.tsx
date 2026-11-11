import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { describeDiscount, discountLifecycle, toSaDayInput } from "@/lib/discounts";
import { orderNumber } from "@/lib/orderLabels";
import { formatCurrency } from "@/lib/pricingUtils";
import { updateDiscountAction } from "@/app/actions/discounts";
import { DiscountForm } from "@/components/admin/DiscountForm";
import { DiscountControls } from "@/components/admin/DiscountControls";
import {
  AdminCard,
  AdminPageHeader,
  DiscountStatusBadge,
  LINK_CLASSES,
  OrderStatusBadge,
  formatAdminDate,
} from "@/components/admin/ui";

const RECENT_ORDERS = 10;

export default async function DiscountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { created } = await searchParams;
  if (id.length > 64) notFound();

  const code = await prisma.discountCode.findUnique({ where: { id } });
  if (!code) notFound();

  const [usage, recent] = await Promise.all([
    prisma.order.aggregate({
      where: { discountCodeId: code.id },
      _count: { _all: true },
      _sum: { discountAmount: true, totalPrice: true },
    }),
    prisma.order.findMany({
      where: { discountCodeId: code.id },
      orderBy: { createdAt: "desc" },
      take: RECENT_ORDERS,
      select: { id: true, customerName: true, createdAt: true, status: true, discountAmount: true },
    }),
  ]);
  const uses = usage._count._all;
  const status = discountLifecycle(code, uses);

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/discounts", label: "All discounts" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{code.code}</span>
            <DiscountStatusBadge status={status} />
          </span>
        }
        description={
          <>
            {describeDiscount(code)}
            {code.description && ` · ${code.description}`}
          </>
        }
        actions={<DiscountControls discountId={code.id} active={code.active} used={uses > 0} />}
      />

      {created && (
        <p role="status" className="mb-4 rounded-lg bg-trail-teal/10 px-3 py-2 text-sm font-medium text-admin-ink">
          Code created. Customers can enter {code.code} in their cart
          {status === "ACTIVE" ? " now." : " once it's active."}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <AdminCard title="Settings" description="Changes apply to new orders only. Past orders keep the discount they got.">
          <div className="px-5 py-5">
            <DiscountForm
              action={updateDiscountAction.bind(null, code.id)}
              codeLocked={uses > 0}
              submitLabel="Save changes"
              defaults={{
                code: code.code,
                description: code.description ?? "",
                type: code.type,
                value: String(Number(code.value)),
                minOrderTotal: code.minOrderTotal === null ? "" : String(Number(code.minOrderTotal)),
                maxUses: code.maxUses === null ? "" : String(code.maxUses),
                startsOn: toSaDayInput(code.startsAt),
                endsOn: toSaDayInput(code.endsAt),
                oncePerCustomer: code.oncePerCustomer,
                active: code.active,
              }}
            />
          </div>
        </AdminCard>

        <div className="flex flex-col gap-6">
          <AdminCard title="Usage">
            <dl className="grid grid-cols-2 gap-4 px-5 py-4">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs font-medium text-admin-muted">Orders</dt>
                <dd className="text-xl font-bold tabular-nums text-admin-ink">
                  {uses.toLocaleString("en-ZA")}
                  {code.maxUses !== null && (
                    <span className="text-sm font-medium text-admin-faint"> / {code.maxUses.toLocaleString("en-ZA")}</span>
                  )}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs font-medium text-admin-muted">Discount given</dt>
                <dd className="text-xl font-bold tabular-nums text-admin-ink">
                  {formatCurrency(Number(usage._sum.discountAmount ?? 0))}
                </dd>
              </div>
              <div className="col-span-2 flex flex-col gap-0.5">
                <dt className="text-xs font-medium text-admin-muted">Revenue from these orders</dt>
                <dd className="font-semibold tabular-nums text-admin-ink">{formatCurrency(Number(usage._sum.totalPrice ?? 0))}</dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard
            title="Recent orders"
            description={uses > RECENT_ORDERS ? `The latest ${RECENT_ORDERS} of ${uses}.` : undefined}
          >
            {recent.length === 0 ? (
              <p className="px-5 py-4 text-sm text-admin-muted">Not used yet.</p>
            ) : (
              <ul className="divide-y divide-admin-line">
                {recent.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/admin/orders/${o.id}`} className={`font-mono text-[13px] ${LINK_CLASSES}`}>
                        {orderNumber(o.id)}
                      </Link>
                      <p className="truncate text-xs text-admin-muted">
                        {o.customerName} · {formatAdminDate(o.createdAt)} · −{formatCurrency(Number(o.discountAmount))}
                      </p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>
    </>
  );
}
