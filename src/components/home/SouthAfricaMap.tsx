/**
 * Stylised map of South Africa with routes from Cape Town to a few major cities.
 * The outline is hand-traced from approximate border coordinates (Lesotho cut
 * out) — recognisable, not survey-accurate.
 */

type LonLat = [number, number];

const OUTLINE: LonLat[] = [
  [16.45, -28.6], [17.4, -28.7], [18.2, -28.9], [19.0, -28.9], [19.9, -28.45], [20.0, -24.75],
  [20.6, -26.8], [21.7, -26.85], [22.6, -26.0], [23.0, -25.35], [24.0, -25.6], [25.0, -25.75],
  [25.6, -25.5], [26.0, -24.7], [26.8, -24.3], [27.0, -23.65], [28.0, -22.6], [29.0, -22.2],
  [30.0, -22.3], [31.3, -22.4], [31.5, -23.5], [31.9, -24.5], [31.95, -25.4], [31.3, -25.75],
  [30.8, -26.0], [30.8, -26.8], [31.2, -27.3], [31.9, -27.3], [32.1, -26.85], [32.9, -26.85],
  [32.6, -27.8], [32.4, -28.6], [31.8, -29.1], [31.05, -29.85], [30.4, -30.8], [29.9, -31.3],
  [29.1, -32.1], [28.0, -33.0], [26.6, -33.7], [25.6, -33.95], [25.7, -34.05], [24.8, -34.2],
  [23.4, -34.1], [22.1, -34.2], [20.0, -34.83], [19.3, -34.6], [18.8, -34.4], [18.5, -34.35],
  [18.4, -33.9], [18.0, -33.0], [18.3, -32.6], [17.9, -31.4], [17.3, -30.3], [16.9, -29.3],
];

const LESOTHO: LonLat[] = [
  [27.0, -29.6], [27.5, -28.9], [28.3, -28.6], [29.0, -28.9], [29.45, -29.4], [29.1, -30.0],
  [28.4, -30.6], [27.7, -30.6], [27.0, -30.1],
];

const CAPE_TOWN: LonLat = [18.42, -33.92];

/** Where each city's label sits relative to its dot. */
const CITIES: { name: string; at: LonLat; label: "right" | "left" }[] = [
  { name: "Johannesburg", at: [28.05, -26.2], label: "right" },
  { name: "Durban", at: [31.02, -29.86], label: "right" },
  { name: "Bloemfontein", at: [26.2, -29.1], label: "left" },
  { name: "Gqeberha", at: [25.6, -33.96], label: "right" },
];

// Equirectangular projection, squashed horizontally for South Africa's latitude.
const SCALE = 32;
const LON_SQUASH = 0.875;
const PAD = 12;
const WIDTH = Math.ceil(PAD * 2 + (32.95 - 16.4) * LON_SQUASH * SCALE);
const HEIGHT = Math.ceil(PAD * 2 + (34.9 - 22.1) * SCALE);

function project([lon, lat]: LonLat): [number, number] {
  return [PAD + (lon - 16.4) * LON_SQUASH * SCALE, PAD + (-22.1 - lat) * SCALE];
}

function ring(points: LonLat[]) {
  return `M${points.map((p) => project(p).map((v) => v.toFixed(1)).join(" ")).join(" L")} Z`;
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

const LABEL_POSITION = {
  right: "translate-x-3 -translate-y-1/2",
  left: "-translate-x-[calc(100%+12px)] -translate-y-1/2",
};

const LABEL_CLASSES =
  "absolute whitespace-nowrap rounded-full border-[1.5px] border-night px-3 py-1.5 text-[11px] font-black uppercase tracking-wide sm:text-[13px]";

export function SouthAfricaMap({ className = "" }: { className?: string }) {
  const [ctX, ctY] = project(CAPE_TOWN);

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full overflow-visible drop-shadow-[6px_6px_0_rgba(22,18,42,0.5)]"
        role="img"
        aria-label="Map of South Africa with delivery routes from Cape Town to Johannesburg, Durban, Bloemfontein and Gqeberha"
      >
        <path
          d={`${ring(OUTLINE)} ${ring(LESOTHO)}`}
          fill="var(--color-sand)"
          fillRule="evenodd"
          stroke="var(--color-night)"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        {CITIES.map(({ name, at }) => {
          const [x, y] = project(at);
          const curveY = Math.min(ctY, y) - 60;
          return (
            <path
              key={name}
              d={`M${ctX} ${ctY} Q${(ctX + x) / 2} ${curveY} ${x} ${y}`}
              fill="none"
              stroke="var(--color-zap)"
              strokeWidth={2.5}
              strokeDasharray="6 7"
              strokeLinecap="round"
            />
          );
        })}
        {CITIES.map(({ name, at }) => {
          const [x, y] = project(at);
          return (
            <circle
              key={name}
              cx={x}
              cy={y}
              r={7}
              fill="var(--color-zap)"
              stroke="var(--color-night)"
              strokeWidth={2}
            />
          );
        })}
        <circle cx={ctX} cy={ctY} r={14} fill="var(--color-blaze)" stroke="var(--color-night)" strokeWidth={3} />
        <circle cx={ctX} cy={ctY} r={5} fill="var(--color-night)" />
      </svg>

      {/* City labels, positioned in % of the map so they track it at any size. */}
      <div aria-hidden="true">
        {CITIES.map(({ name, at, label }) => {
          const [x, y] = project(at);
          return (
            <span
              key={name}
              className={`${LABEL_CLASSES} bg-night text-zap ${LABEL_POSITION[label]}`}
              style={{ left: pct(x, WIDTH), top: pct(y, HEIGHT) }}
            >
              {name}
            </span>
          );
        })}
        <span
          className={`${LABEL_CLASSES} -translate-x-1/2 translate-y-6 bg-blaze text-white`}
          style={{ left: pct(ctX, WIDTH), top: pct(ctY, HEIGHT) }}
        >
          ★ Cape Town
        </span>
      </div>
    </div>
  );
}
