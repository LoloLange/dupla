"use client";

const BARRAS = 11;

export function RecordingWaves({
  nivel,
  activo,
}: {
  nivel: number;
  activo: boolean;
}) {
  return (
    <div
      className="flex h-16 items-center justify-center gap-1"
      aria-hidden
    >
      {Array.from({ length: BARRAS }).map((_, i) => {
        const fase = Math.sin(i * 0.9 + 1.2) * 0.5 + 0.5;
        const extra = activo ? (nivel / 255) * 0.85 : 0;
        const escala = Math.min(1, 0.14 + fase * 0.28 + extra);
        return (
          <span
            key={i}
            className="w-1.5 rounded-full bg-ars-strong"
            style={{
              height: 52,
              transform: `scaleY(${escala})`,
              transformOrigin: "center",
              transition: "transform 110ms ease-out",
            }}
          />
        );
      })}
    </div>
  );
}
