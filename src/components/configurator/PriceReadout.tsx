import { formatCurrency } from "@/lib/pricingUtils";

export function PriceReadout({
  totalPrice,
  pricePerUnit,
  savingsPercent,
  status,
}: {
  totalPrice: number | null;
  pricePerUnit: number | null;
  /** Only pass for quantities the tier list doesn't already badge (custom amounts). */
  savingsPercent: number;
  status: "empty" | "ready";
}) {
  const ready = status === "ready" && totalPrice !== null;

  return (
    <div className="border-t border-ink/[0.09] p-4">
      <div className="rounded-xl border border-ink/[0.09] bg-mist p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-black text-ink">
            Total: {ready ? formatCurrency(totalPrice) : "—"}
          </p>
          <div className="flex items-center gap-1.5">
            {ready && savingsPercent > 0 && (
              <span className="rounded-full bg-zap px-2 py-1 text-xs font-black text-ink">
                Save {savingsPercent}%
              </span>
            )}
            {ready && pricePerUnit !== null && (
              <span className="rounded-full bg-grape px-2 py-1 text-xs font-black text-white">
                {formatCurrency(pricePerUnit)}/ea.
              </span>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-quiet">
          {ready
            ? "🚀 Ships 3–5 working days after proof approval"
            : "Pick a size to see live pricing"}
        </p>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5 text-xs text-quiet">
        <li className="flex items-center gap-2">
          <span aria-hidden className="text-sm text-ink">
            📝
          </span>
          We send a proof for your approval before printing
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="text-sm text-ink">
            🔒
          </span>
          Secure checkout
        </li>
      </ul>
    </div>
  );
}
