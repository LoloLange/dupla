"use client";

import type { Moneda } from "@/lib/types";
import { MONEDAS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FiltroMoneda({
  seleccionadas,
  onChange,
}: {
  seleccionadas: Moneda[];
  onChange: (monedas: Moneda[]) => void;
}) {
  const alternar = (moneda: Moneda) => {
    onChange(
      seleccionadas.includes(moneda)
        ? seleccionadas.filter((m) => m !== moneda)
        : [...seleccionadas, moneda],
    );
  };

  return (
    <div
      role="group"
      aria-label="Filtrar por moneda"
      className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:w-auto"
    >
      {MONEDAS.map(({ codigo, etiqueta }) => {
        const activa = seleccionadas.includes(codigo);
        return (
          <button
            key={codigo}
            type="button"
            onClick={() => alternar(codigo)}
            aria-pressed={activa}
            className={cn(
              "shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-[0.97]",
              activa
                ? "border-ink bg-ink text-bg shadow-sm"
                : "border-line bg-surface text-sub hover:border-ink hover:text-ink",
            )}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}
