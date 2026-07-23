export function SizeIcon({ cm, className }: { cm: number; className?: string }) {
  // Scale the circle within the icon so preset sizes visibly grow relative to each other.
  const r = 6 + (cm - 5.08) * (3 / 2.54);
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none">
      <circle cx="24" cy="24" r={r} stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 3" />
    </svg>
  );
}

export function CustomSizeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="19" width="32" height="10" rx="2" transform="rotate(-8 24 24)" />
      <path d="M14 20l1.5 3M20 19l1.5 3M26 18l1.5 3M32 17l1.5 3" strokeWidth="2" />
    </svg>
  );
}
