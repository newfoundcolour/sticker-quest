"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { discountFormSchema } from "@/lib/discounts";
import { Prisma } from "@/generated/prisma/client";

export type DiscountFormState =
  | {
      ok: boolean;
      message?: string;
      fieldErrors?: Record<string, string>;
      values?: Record<string, string>;
    }
  | undefined;

const idSchema = z.string().min(1).max(64);

const FORM_FIELDS = [
  "code",
  "description",
  "type",
  "value",
  "minOrderTotal",
  "maxUses",
  "startsOn",
  "endsOn",
  "oncePerCustomer",
  "active",
] as const;

function readForm(formData: FormData): Record<string, string> {
  return Object.fromEntries(FORM_FIELDS.map((k) => [k, String(formData.get(k) ?? "")]));
}

function errorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function revalidateDiscounts(id?: string) {
  revalidatePath("/admin/discounts");
  if (id) revalidatePath(`/admin/discounts/${id}`);
}

/** New code from /admin/discounts/new. */
export async function createDiscountAction(_prev: DiscountFormState, formData: FormData): Promise<DiscountFormState> {
  const staff = await requireStaff();
  const values = readForm(formData);
  const parsed = discountFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, fieldErrors: errorsFrom(parsed.error), values };

  let id: string;
  try {
    const created = await prisma.discountCode.create({ data: { ...parsed.data, createdById: staff.id } });
    id = created.id;
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, fieldErrors: { code: "A code with that name already exists." }, values };
    throw error;
  }

  revalidateDiscounts();
  redirect(`/admin/discounts/${id}?created=1`);
}

/** Edit from /admin/discounts/[id]. A code that has been used keeps its name. */
export async function updateDiscountAction(
  discountId: string,
  _prev: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  await requireStaff();
  if (!idSchema.safeParse(discountId).success) return { ok: false, message: "That code no longer exists." };

  const existing = await prisma.discountCode.findUnique({
    where: { id: discountId },
    select: { code: true, _count: { select: { orders: true } } },
  });
  if (!existing) return { ok: false, message: "That code no longer exists." };

  const values = readForm(formData);
  const parsed = discountFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, fieldErrors: errorsFrom(parsed.error), values };
  if (existing._count.orders > 0 && parsed.data.code !== existing.code) {
    return { ok: false, fieldErrors: { code: "This code has been used, so its name can't change." }, values };
  }

  try {
    await prisma.discountCode.update({ where: { id: discountId }, data: parsed.data });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, fieldErrors: { code: "A code with that name already exists." }, values };
    throw error;
  }

  revalidateDiscounts(discountId);
  return { ok: true, message: "Saved." };
}

/** The On/Off switch on a code's page. */
export async function setDiscountActiveAction(discountId: string, active: boolean): Promise<void> {
  await requireStaff();
  if (!idSchema.safeParse(discountId).success || typeof active !== "boolean") return;
  await prisma.discountCode.updateMany({ where: { id: discountId }, data: { active } });
  revalidateDiscounts(discountId);
}

/**
 * Deletes a code nobody has used yet. A used code is turned off instead, so
 * the orders that used it keep their link to it.
 */
export async function deleteDiscountAction(discountId: string): Promise<{ ok: false; message: string } | void> {
  await requireStaff();
  if (!idSchema.safeParse(discountId).success) return { ok: false, message: "That code no longer exists." };

  const uses = await prisma.order.count({ where: { discountCodeId: discountId } });
  if (uses > 0) return { ok: false, message: "This code has been used, so it can't be deleted. Turn it off instead." };

  await prisma.discountCode.deleteMany({ where: { id: discountId } });
  revalidateDiscounts();
  redirect("/admin/discounts?deleted=1");
}
