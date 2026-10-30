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
        <div className="flex w-full flex-wrap items-center gap-3 rounded-full bg-night px-6 py-3">
          <p className="text-2xl font-bold leading-[1.5] text-zap">
            Total: {ready ? formatCurrency(totalPrice) : "—"}
          </p>
          {ready && pricePerUnit !== null && (
            <span className="rounded-full bg-dusk-pill px-3 py-1 text-sm font-black text-sand">
              {formatCurrency(pricePerUnit)}/ea.
            </span>
          )}
        </div>
        {ready && savingsPercent > 0 && (
          <span className="text-sm font-black text-zap">Save {savingsPercent}%</span>
        )}
        {!ready && <p className="text-xs text-dusk-note">Pick a size to see live pricing</p>}
      </div>

      <ul className="flex flex-col gap-[5px] text-xs text-dusk-note">
        {ready && (
          <li className="flex items-center gap-2">
            <span aria-hidden>🐎</span>
            Ships 3–5 working days after proof approval
          </li>
        )}
        <li className="flex items-center gap-2">
          <span aria-hidden>📜</span>
          We send a proof for your approval before printing
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden>🛡️</span>
          Secure checkout
        </li>
      </ul>
    </div>
  );
}
