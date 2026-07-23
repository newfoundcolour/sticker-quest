export function SwordIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* blade */}
      <path d="M34 8L14 28l-3 3 3 3 3-3 20-20z" />
      {/* crossguard */}
      <path d="M17 25l-8 0M17 25l0 8" strokeWidth="2" />
      {/* grip + pommel */}
      <path d="M11 31l-3 3" />
      <circle cx="7" cy="35" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
