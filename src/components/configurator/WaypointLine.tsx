import { Character } from "@/components/Character";

export type WaypointStep = {
  key: string;
  label: string;
};

export function WaypointLine({
  steps,
  completed,
  activeIndex,
}: {
  steps: readonly WaypointStep[];
  completed: readonly boolean[];
  activeIndex: number;
}) {
  const columnWidth = 100 / steps.length;
  const mascotLeft = columnWidth * (activeIndex + 0.5);

  return (
    <div className="relative pt-14">
      <div
        className="absolute left-0 top-14 -translate-y-1/2 transition-[left] duration-500 ease-out"
        style={{ left: `${mascotLeft}%` }}
      >
        <Character name="wizard" size={56} className="-translate-x-1/2 -translate-y-3" />
      </div>

      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
        <div className="absolute left-0 right-0 top-2.5 h-0.5 bg-ink-navy/15" />
        {steps.map((step, i) => {
          const isDone = completed[i];
          const isActive = i === activeIndex;
          return (
            <div key={step.key} className="relative flex flex-col items-center gap-2">
              <div
                className={[
                  "h-5 w-5 rounded-full border-2 transition-colors",
                  isDone
                    ? "bg-waypoint-gold border-waypoint-gold"
                    : isActive
                      ? "bg-coral-signal border-coral-signal"
                      : "bg-paper border-ink-navy/25",
                ].join(" ")}
              />
              <span
                className={[
                  "text-sm font-medium",
                  isActive ? "text-ink-navy" : "text-ink-navy/50",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
