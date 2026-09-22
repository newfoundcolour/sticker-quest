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
    <div className="border-t border-grape">
      <div className="flex flex-col items-center gap-2 bg-zap/[0.19] px-4 py-3.5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="text-[30px] font-black text-night">
            Total: {ready ? formatCurrency(totalPrice) : "—"}
          </p>
          {ready && savingsPercent > 0 && (
            <span className="rounded-full bg-white/70 px-2 py-1 text-base font-black text-night">
              Save {savingsPercent}%
            </span>
          )}
          {ready && pricePerUnit !== null && (
            <span className="rounded-full border border-grape bg-grape px-3 py-1 text-sm font-black text-white shadow-pop-grape-soft">
              {formatCurrency(pricePerUnit)}/ea.
            </span>
          )}
        </div>
        <p className="text-xs text-night/60">
          {ready
            ? "🚀 Ships 3–5 working days after proof approval"
            : "Pick a size to see live pricing"}
        </p>
      </div>

      <ul className="flex flex-col gap-[5px] px-4 py-3.5 text-xs text-night/55">
        <li className="flex items-center gap-2">
          <span aria-hidden>📝</span>
          We send a proof for your approval before printing
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden>🔒</span>
          Secure checkout
        </li>
      </ul>
    </div>
  );
}
