"use client";

import { CATEGORIAS_TODAS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FiltroCategoria({
  seleccionadas,
  onChange,
}: {
  seleccionadas: string[];
  onChange: (categorias: string[]) => void;
}) {
  const alternar = (categoria: string) => {
    onChange(
      seleccionadas.includes(categoria)
        ? seleccionadas.filter((c) => c !== categoria)
        : [...seleccionadas, categoria]
    );
  };

  return (
    <div
      role="group"
      aria-label="Filtrar por categoría"
      className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:w-auto"
    >
      {CATEGORIAS_TODAS.map((categoria) => {
        const activa = seleccionadas.includes(categoria);
        return (
          <button
            key={categoria}
            type="button"
            onClick={() => alternar(categoria)}
            aria-pressed={activa}
            className={cn(
              "shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-[0.97]",
              activa
                ? "border-ink bg-ink text-bg shadow-sm"
                : "border-line bg-surface text-sub hover:border-ink hover:text-ink"
            )}
          >
            {categoria}
          </button>
        );
      })}
    </div>
  );
}
