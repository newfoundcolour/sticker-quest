/**
 * The brand mascot: a sticker with a peeling corner and a simple friendly
 * face. Deliberately not an animal/alien — see DESIGN.md.
 */
export function Mascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      {/* backing paper, peeking out from under the lifted corner */}
      <rect
        x="14"
        y="16"
        width="38"
        height="38"
        rx="9"
        fill="var(--color-waypoint-gold)"
        fillOpacity="0.35"
      />

      {/* sticker body */}
      <path
        d="M10 22c0-6.6 5.4-12 12-12h20c6.6 0 12 5.4 12 12v20c0 6.6-5.4 12-12 12H24c-6.6 0-12-5.4-12-12V29.5L34 12l-9 9.5H22c-6.6 0-12 5.4-12 5.5Z"
        fill="var(--color-coral-signal)"
      />
      {/* peeled corner flap */}
      <path
        d="M34 10c6.5-2.4 12 1 12 1L23 34s-3.6-5.7-1-12C24.3 16.6 28.8 12.1 34 10Z"
        fill="var(--color-coral-signal)"
        stroke="var(--color-ink-navy)"
        strokeOpacity="0.08"
      />
      <path
        d="M23 34c-2.6-6.3.4-12.6 1-14"
        fill="none"
        stroke="var(--color-ink-navy)"
        strokeOpacity="0.15"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* face */}
      <circle cx="30" cy="38" r="2.4" fill="var(--color-ink-navy)" />
      <circle cx="41" cy="38" r="2.4" fill="var(--color-ink-navy)" />
      <path
        d="M29 45c3 3 8 3 11 0"
        fill="none"
        stroke="var(--color-ink-navy)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
