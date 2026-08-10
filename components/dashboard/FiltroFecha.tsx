"use client";

import { RANGOS_FECHA, type RangoFecha } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function FiltroFecha({
  rango,
  onChange,
}: {
  rango: RangoFecha;
  onChange: (rango: RangoFecha) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filtrar por fecha"
      className="flex w-full items-center gap-1.5 overflow-x-auto no-scrollbar sm:w-auto"
    >
      {RANGOS_FECHA.map((r) => {
        const activo = rango === r.id;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            aria-pressed={activo}
            className={cn(
              "shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-[0.97]",
              activo
                ? "border-ars bg-ars text-white shadow-sm"
                : "border-line bg-surface text-sub hover:border-ink hover:text-ink"
            )}
          >
            {r.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
