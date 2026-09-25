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
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-start gap-2.5 text-left">
        <div className="flex w-full flex-wrap items-center gap-3 rounded-full border-[1.5px] border-zap-deep bg-zap px-6 py-3 text-night shadow-pop-zap">
          <p className="text-[30px] font-bold leading-tight">
            Total: <span className="font-black">{ready ? formatCurrency(totalPrice) : "—"}</span>
          </p>
          {ready && pricePerUnit !== null && (
            <span className="rounded-full border-[1.5px] border-night bg-grape px-3 py-1 text-sm font-black text-white">
              {formatCurrency(pricePerUnit)}/ea.
            </span>
          )}
        </div>
        {ready && savingsPercent > 0 && (
          <span className="text-sm font-black text-grape">Save {savingsPercent}%</span>
        )}
        <p className="text-xs text-night/60">
          {ready
            ? "🚀 Ships 3–5 working days after proof approval"
            : "Pick a size to see live pricing"}
        </p>
      </div>

      <ul className="flex flex-col gap-[5px] text-xs text-night/55">
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
