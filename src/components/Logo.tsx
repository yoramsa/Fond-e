export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="48" height="48" rx="12" fill="var(--ink)" />
      <path
        d="M13,10 H20 V27 H28 V24 L39,30.5 L28,37 V34 H13 Z"
        fill="#fff"
      />
      <circle cx="40" cy="13" r="4" fill="var(--red)" />
    </svg>
  );
}

export default function Logo({ className }: { className?: string }) {
  return (
    <span className={`logo-mark-wrap ${className ?? ""}`}>
      <LogoMark className="logo-mark" />
      <span className="logo-word">
        légalgo<i>.</i>
      </span>
    </span>
  );
}
