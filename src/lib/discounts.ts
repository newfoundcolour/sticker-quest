import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { DiscountCode, Prisma } from "@/generated/prisma/client";
import { formatCurrency } from "@/lib/pricingUtils";

/** Codes are letters, numbers, dashes and underscores; stored upper-case. */
export const DISCOUNT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,29}$/;
export const DISCOUNT_CODE_MAX_LENGTH = 30;

export function normalizeDiscountCode(raw: unknown): string {
  return String(raw ?? "").trim().toUpperCase().slice(0, 40);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Rand off an items subtotal: a percentage of it, or a fixed amount that never takes it below 0. */
export function discountAmountFor(code: Pick<DiscountCode, "type" | "value">, subtotal: number): number {
  const value = Number(code.value);
  if (!(subtotal > 0) || !(value > 0)) return 0;
  const amount = code.type === "PERCENT" ? subtotal * (Math.min(value, 100) / 100) : value;
  return round2(Math.min(amount, subtotal));
}

/** "15% off" / "R 100.00 off". */
export function describeDiscount(code: Pick<DiscountCode, "type" | "value">): string {
  const value = Number(code.value);
  return code.type === "PERCENT" ? `${Number.isInteger(value) ? value : value.toFixed(2)}% off` : `${formatCurrency(value)} off`;
}

export type DiscountLifecycle = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "USED_UP" | "DISABLED";

/** Where a code stands right now, ignoring per-cart rules (minimum order, once per customer). */
export function discountLifecycle(
  code: Pick<DiscountCode, "active" | "startsAt" | "endsAt" | "maxUses">,
  uses: number,
  now = new Date(),
): DiscountLifecycle {
  if (!code.active) return "DISABLED";
  if (code.endsAt && now >= code.endsAt) return "EXPIRED";
  if (code.maxUses !== null && uses >= code.maxUses) return "USED_UP";
  if (code.startsAt && now < code.startsAt) return "SCHEDULED";
  return "ACTIVE";
}

export type DiscountCheck =
  | { ok: true; code: DiscountCode; amount: number }
  | { ok: false; message: string };

type Db = typeof prisma | Prisma.TransactionClient;

/**
 * Whether `rawCode` gives a discount on a cart with this items subtotal, and
 * how much. `userId` is checked for once-per-customer codes; without one
 * (a guest cart) that rule waits until checkout, which always has a user.
 * Unknown and switched-off codes get the same message, so the reply doesn't
 * reveal which codes exist.
 */
export async function checkDiscount(
  rawCode: string,
  { subtotal, userId, db = prisma }: { subtotal: number; userId?: string; db?: Db },
): Promise<DiscountCheck> {
  const codeText = normalizeDiscountCode(rawCode);
  if (!DISCOUNT_CODE_PATTERN.test(codeText)) return { ok: false, message: "That code isn't valid." };

  const code = await db.discountCode.findUnique({ where: { code: codeText } });
  if (!code || !code.active) return { ok: false, message: "That code isn't valid." };

  const now = new Date();
  if (code.startsAt && now < code.startsAt) return { ok: false, message: `${code.code} isn't active yet.` };
  if (code.endsAt && now >= code.endsAt) return { ok: false, message: `${code.code} has expired.` };

  if (code.maxUses !== null) {
    const uses = await db.order.count({ where: { discountCodeId: code.id } });
    if (uses >= code.maxUses) return { ok: false, message: `${code.code} has been fully used.` };
  }
  if (code.oncePerCustomer && userId) {
    const mine = await db.order.count({ where: { discountCodeId: code.id, userId } });
    if (mine > 0) return { ok: false, message: `You've already used ${code.code}.` };
  }

  const min = code.minOrderTotal === null ? 0 : Number(code.minOrderTotal);
  if (min > 0 && subtotal < min) {
    return { ok: false, message: `${code.code} needs an order of at least ${formatCurrency(min)} (before shipping).` };
  }

  const amount = discountAmountFor(code, subtotal);
  if (!(amount > 0)) return { ok: false, message: `${code.code} doesn't take anything off this cart.` };
  return { ok: true, code, amount };
}

// ─── Admin form ────────────────────────────────────────────────────────────

/** Dates are entered as SA calendar days (SAST is UTC+2 all year). */
function saDay(value: string, endOfDay: boolean): Date {
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+02:00`);
}

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)), schema.optional());
const optionalDay = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Pick a date.")
  .transform((v) => v || undefined);

/** The create/edit form in /admin/discounts. Checked server-side on every save. */
export const discountFormSchema = z
  .object({
    code: z
      .string()
      .transform((v) => v.trim().toUpperCase())
      .pipe(
        z
          .string()
          .regex(DISCOUNT_CODE_PATTERN, "3–30 letters or numbers (dashes and underscores are fine), starting with a letter or number."),
      ),
    description: z
      .string()
      .trim()
      .max(200, "Keep the note under 200 characters.")
      .transform((v) => v || null),
    type: z.enum(["PERCENT", "FIXED"], { message: "Choose a discount type." }),
    value: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number({ message: "Enter an amount." }).finite()),
    minOrderTotal: optionalNumber(z.number().finite().min(0, "Can't be negative.").max(1_000_000)),
    maxUses: optionalNumber(z.number().int("Whole numbers only.").min(1, "At least 1.").max(1_000_000)),
    startsOn: optionalDay,
    endsOn: optionalDay,
    oncePerCustomer: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
    active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  })
  .superRefine((d, ctx) => {
    if (d.type === "PERCENT" && !(d.value >= 1 && d.value <= 100)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "A percentage between 1 and 100." });
    }
    if (d.type === "FIXED" && !(d.value > 0 && d.value <= 100_000)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "An amount between R 0.01 and R 100 000." });
    }
    if (d.startsOn && d.endsOn && d.endsOn < d.startsOn) {
      ctx.addIssue({ code: "custom", path: ["endsOn"], message: "Must be on or after the start date." });
    }
  })
  .transform((d) => ({
    code: d.code,
    description: d.description,
    type: d.type,
    value: Math.round(d.value * 100) / 100,
    minOrderTotal: d.minOrderTotal ?? null,
    maxUses: d.maxUses ?? null,
    startsAt: d.startsOn ? saDay(d.startsOn, false) : null,
    endsAt: d.endsOn ? saDay(d.endsOn, true) : null,
    oncePerCustomer: d.oncePerCustomer,
    active: d.active,
  }));

export type DiscountFormData = z.output<typeof discountFormSchema>;

/** A stored date back as the SA calendar day for a date input. */
export function toSaDayInput(date: Date | null): string {
  if (!date) return "";
  return new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
