"use client";

import { useMemo } from "react";
import type { Gasto, Categoria } from "@/lib/types";
import { formatFechaCorta, formatHora, formatMonto } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ICONOS: Record<Categoria, string> = {
  Supermercado: "🛒",
  "Comida y bares": "🍽️",
  Transporte: "🚕",
  Vivienda: "🏠",
  Servicios: "💡",
  Salud: "💊",
  Entretenimiento: "🎬",
  Suscripciones: "🔁",
  Educación: "📚",
  Otros: "✨",
};

function iconoCategoria(cat: string): string {
  return ICONOS[cat as Categoria] ?? "✨";
}

export function UltimosGastos({
  gastos,
  cargando,
  onEliminar,
}: {
  gastos: Gasto[];
  cargando: boolean;
  onEliminar: (id: string) => void;
}) {
  const grupos = useMemo(() => {
    const mapa = new Map<string, Gasto[]>();
    for (const g of gastos) {
      const clave = new Date(g.fecha).toDateString();
      const arr = mapa.get(clave) ?? [];
      arr.push(g);
      mapa.set(clave, arr);
    }
    return Array.from(mapa.entries());
  }, [gastos]);

  if (cargando) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-surface"
            style={{
              backgroundImage:
                "linear-gradient(90deg, transparent, var(--surface-2), transparent)",
              backgroundSize: "400px 100%",
              animation: "shimmer 1.6s linear infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (gastos.length === 0) {
    return (
      <div className="anim-fade-up rounded-3xl border border-dashed border-line px-6 py-12 text-center">
        <p className="text-4xl">🎙️</p>
        <p className="mt-4 font-display text-xl font-medium tracking-tight text-ink">
          Todavía no cargaste ningún movimiento
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-sub">
          Mantené el botón naranja y contá tu gasto o ingreso con la voz. Dupla
          se encarga del resto.
        </p>
      </div>
    );
  }

  return (
    <section className="anim-fade-up">
      <h2 className="mb-3 font-display text-xl font-medium tracking-tight text-ink">
        Movimientos
      </h2>
      <div className="space-y-4 lg:columns-2 lg:gap-6 lg:space-y-0">
        {grupos.map(([fecha, lista]) => (
          <div key={fecha} className="lg:mb-6 lg:break-inside-avoid">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-faint">
              {formatFechaCorta(lista[0].fecha)}
            </p>
            <div className="overflow-hidden rounded-3xl border border-line bg-surface">
              {lista.map((gasto, i) => (
                <div
                  key={gasto.id}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2/50",
                    i > 0 && "border-t border-line"
                  )}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-surface-2 text-lg">
                    {iconoCategoria(gasto.categoria)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">
                      {gasto.descripcion || gasto.categoria}
                    </p>
                    <p className="text-xs text-sub">
                      {gasto.categoria} · {formatHora(gasto.fecha)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "font-display text-lg font-semibold tracking-tight tabular-nums",
                        gasto.tipo === "ingreso"
                          ? "text-ok"
                          : gasto.moneda === "USD"
                            ? "text-usd-strong"
                            : "text-ars-strong"
                      )}
                    >
                      {gasto.tipo === "ingreso" ? "+" : "−"}
                      {formatMonto(Number(gasto.monto), gasto.moneda)}
                    </p>
                    <button
                      type="button"
                      aria-label="Eliminar gasto"
                      onClick={() => onEliminar(gasto.id)}
                      className="grid size-8 place-items-center rounded-full text-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-2 hover:text-danger"
                    >
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
