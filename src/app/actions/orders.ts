"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { ORDER_STATUS_VALUES } from "@/lib/orderLabels";
import { recordStaffApprovalIfPending } from "@/lib/proofs";
import type { OrderStatus } from "@/generated/prisma/client";

export type UpdateOrderResult = { ok: true } | { ok: false; error: string };

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUS_VALUES as string[]).includes(value);
}

function revalidateOrder(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/account", "layout");
}

/**
 * Staff can still move an order to any status by hand. Setting Approved
 * while the latest proof is pending records that proof as approved by staff
 * on the customer's behalf, so the proof history stays truthful.
 */
async function setStatus(orderId: string, status: OrderStatus, staffId: string, data: { trackingNumber?: string | null } = {}) {
  if (status === "APPROVED") await recordStaffApprovalIfPending(orderId, staffId);
  await prisma.order.update({ where: { id: orderId }, data: { status, ...data } });
}

/** Called from the order detail view's status + tracking number form. */
export async function updateOrderAction(
  orderId: string,
  _prevState: UpdateOrderResult | undefined,
  formData: FormData,
): Promise<UpdateOrderResult> {
  const staff = await requireStaff();
  const status = String(formData.get("status") ?? "");
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim().slice(0, 100);

  if (!isOrderStatus(status)) {
    return { ok: false, error: "Select a valid status." };
  }

  await setStatus(orderId, status, staff.id, { trackingNumber: trackingNumber || null });
  revalidateOrder(orderId);
  return { ok: true };
}

/** Called from the inline status dropdown on the orders table — status only, no tracking number. */
export async function setOrderStatusAction(orderId: string, status: OrderStatus): Promise<void> {
  const staff = await requireStaff();
  // Arguments arrive straight from the browser, so re-check the status value.
  if (!isOrderStatus(status)) return;
  await setStatus(orderId, status, staff.id);
  revalidateOrder(orderId);
}
