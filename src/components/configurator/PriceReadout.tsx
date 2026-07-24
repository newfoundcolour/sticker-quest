import { formatCurrency } from "@/lib/pricingUtils";

export function PriceReadout({
  totalPrice,
  pricePerUnit,
  quantity,
  savingsPercent,
  status,
}: {
  totalPrice: number | null;
  pricePerUnit: number | null;
  quantity: number;
  savingsPercent: number;
  status: "empty" | "ready";
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-navy/10 bg-ink-navy px-6 py-5 text-paper">
      <div>
        <p className="text-sm text-paper/60">
          {status === "empty"
            ? "Pick your options to see live pricing"
            : `Total for ${quantity.toLocaleString("en-ZA")} stickers`}
        </p>
        <p className="font-mono text-3xl font-semibold tabular-nums">
          {status === "ready" && totalPrice !== null ? formatCurrency(totalPrice) : "—"}
        </p>
        {status === "ready" && pricePerUnit !== null && (
          <p className="font-mono text-xs text-paper/50">
            {formatCurrency(pricePerUnit)} / sticker
          </p>
        )}
      </div>
      {status === "ready" && savingsPercent > 0 && (
        <span className="rounded-full bg-waypoint-gold px-4 py-1.5 text-sm font-semibold text-ink-navy">
          Save {savingsPercent}%
        </span>
      )}
    </div>
  );
}
