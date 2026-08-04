"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Gasto, Categoria } from "@/lib/types";
import { aInicioDiaLocal, formatDiaGrupo, formatHora, formatMonto } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ThinkingOrb } from "thinking-orbs";
import { buscarLogo, cargarLogos, rutaLogo, type LogoApp, type LogoListo } from "@/lib/svgl";

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
  onEditar,
  onAñadirManual,
}: {
  gastos: Gasto[];
  cargando: boolean;
  onEliminar: (id: string) => void;
  onEditar: (gasto: Gasto) => void;
  onAñadirManual?: () => void;
}) {
  const [logos, setLogos] = useState<LogoListo[] | null>(null);

  useEffect(() => {
    let activo = true;
    cargarLogos()
      .then((l) => {
        if (activo) setLogos(l);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  const logosPorGasto = useMemo(() => {
    if (!logos) return null;
    const mapa = new Map<string, LogoApp | null>();
    for (const g of gastos) {
      mapa.set(g.id, buscarLogo(g.descripcion || g.categoria, logos));
    }
    return mapa;
  }, [gastos, logos]);

  const grupos = useMemo(() => {
    const mapa = new Map<number, Gasto[]>();
    for (const g of gastos) {
      const clave = aInicioDiaLocal(new Date(g.fecha)).getTime();
      const arr = mapa.get(clave) ?? [];
      arr.push(g);
      mapa.set(clave, arr);
    }
    return Array.from(mapa.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([clave, lista]) => ({
        clave: new Date(clave).toISOString(),
        lista: lista
          .slice()
          .sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          ),
      }));
  }, [gastos]);

  if (cargando) {
    return (
      <div className="anim-fade-in flex flex-col items-center gap-3 rounded-3xl border border-line bg-surface px-6 py-12">
        <ThinkingOrb state="working" size={64} aria-label="Cargando movimientos" />
        <p className="text-sm text-sub">Cargando movimientos…</p>
      </div>
    );
  }

  if (gastos.length === 0) {
    return (
      <div className="anim-fade-up flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-12 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-ars/15 text-3xl">
          🎙️
        </span>
        <p className="mt-5 font-display text-2xl font-medium tracking-tight text-ink">
          Empezá contándole tu primer gasto a Dupla
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-sub">
          Mantené presionado el botón naranja y hablá natural. Dupla lo
          escucha, lo entiende y lo anota por vos.
        </p>
        <p className="mt-4 rounded-full border border-line bg-surface px-4 py-2 font-display text-sm text-ink">
          «gasté 8 mil en el súper»
        </p>
        {onAñadirManual && (
          <button
            type="button"
            onClick={onAñadirManual}
            className="mt-6 flex items-center gap-1.5 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-bg transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Cargar a mano
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="anim-fade-up w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-medium tracking-tight text-ink">
          Movimientos
        </h2>
        {onAñadirManual && (
          <button
            type="button"
            onClick={onAñadirManual}
            className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-sub transition-colors hover:border-ink hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Cargar a mano
          </button>
        )}
      </div>
      <div className="space-y-4">
        {grupos.map(({ clave, lista }) => (
          <div key={clave}>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-faint">
              {formatDiaGrupo(clave)}
            </p>
            <div className="overflow-hidden rounded-3xl border border-line bg-surface">
              {lista.map((gasto, i) => {
                const logo = logosPorGasto?.get(gasto.id) ?? null;
                return (
                <div
                  key={gasto.id}
                  onClick={() => onEditar(gasto)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onEditar(gasto);
                  }}
                  tabIndex={0}
                  className={cn(
                    "group flex cursor-pointer items-center gap-3 px-4 py-3.5 outline-none transition-colors hover:bg-surface-2/50 focus-visible:bg-surface-2/50",
                    i > 0 && "border-t border-line"
                  )}
                >
                  <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface-2 text-lg">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- SVG remoto sin reoptimizar (next/image no procesa svg)
                      <img
                        src={rutaLogo(logo.route)}
                        alt={logo.title}
                        loading="lazy"
                        className="size-6 object-contain"
                      />
                    ) : (
                      iconoCategoria(gasto.categoria)
                    )}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(gasto.id);
                      }}
                      className="grid size-8 place-items-center rounded-full text-faint transition-colors hover:bg-surface-2 hover:text-danger lg:opacity-0 lg:group-hover:opacity-100"
                    >
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
