"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_VALUES } from "@/lib/orderLabels";
import type { OrderStatus } from "@/generated/prisma/client";

export type UpdateOrderResult = { ok: true } | { ok: false; error: string };

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUS_VALUES as string[]).includes(value);
}

/** Called from the order detail view's status + tracking number form. */
export async function updateOrderAction(
  orderId: string,
  _prevState: UpdateOrderResult | undefined,
  formData: FormData,
): Promise<UpdateOrderResult> {
  const status = String(formData.get("status") ?? "");
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();

  if (!isOrderStatus(status)) {
    return { ok: false, error: "Select a valid status." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      trackingNumber: trackingNumber || null,
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");

  return { ok: true };
}

/** Called from the inline status dropdown on the orders table — status only, no tracking number. */
export async function setOrderStatusAction(orderId: string, status: OrderStatus): Promise<void> {
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
