export function UploadIcon({ className }: { className?: string }) {
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
      <path d="M24 30V10M24 10l-7 7M24 10l7 7" />
      <path d="M8 30v6a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4v-6" />
    </svg>
  );
}
