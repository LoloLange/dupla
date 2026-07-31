"use client";

import { cn } from "@/lib/utils";

export function Checkmark({
  className,
  stroke = "currentColor",
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 52 52"
      className={cn("size-16", className)}
      fill="none"
      role="img"
      aria-label="Confirmado"
    >
      <circle
        cx="26"
        cy="26"
        r="24"
        stroke={stroke}
        strokeWidth="3"
        opacity="0.2"
      />
      <path
        d="M15 27l8 8 15-16"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 44,
          strokeDashoffset: 44,
          animation: "check-draw 0.45s cubic-bezier(0.65,0,0.35,1) 0.12s forwards",
        }}
      />
    </svg>
  );
}
