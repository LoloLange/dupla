export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 205 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="70"
        cy="100"
        r="70"
        opacity="0.92"
        style={{ fill: "var(--ars)" }}
      />
      <circle
        cx="130"
        cy="100"
        r="70"
        opacity="0.92"
        style={{ fill: "color-mix(in oklab, var(--ars) 52%, var(--ink))" }}
      />
      <path
        d="M 100 32 A 72 72 0 0 1 100 168 A 72 72 0 0 1 100 32 Z"
        style={{ fill: "color-mix(in oklab, var(--ars) 65%, var(--bg))" }}
      />
    </svg>
  );
}
