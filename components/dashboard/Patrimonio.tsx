"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Gasto, Moneda, Tipo } from "@/lib/types";
import {
  formatARS,
  formatUSD,
  formatMonto,
  inicioDeRango,
  etiquetaRango,
  type RangoFecha,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

type Saldo = { ARS: number; USD: number };
type Cotizacion = { casa: string; nombre: string; compra: number; venta: number };

function montoEnRango(
  gastos: Gasto[],
  moneda: Moneda,
  tipo: Tipo,
  rango: RangoFecha
): number {
  const desde = inicioDeRango(rango);
  return gastos
    .filter(
      (g) =>
        g.moneda === moneda &&
        g.tipo === tipo &&
        new Date(g.fecha) >= desde
    )
    .reduce((acc, g) => acc + Number(g.monto), 0);
}

type DatosMoneda = {
  saldoActual: number;
  gastado: number;
  ingresado: number;
  total: number;
};

export function Patrimonio({
  gastos,
  cargando: gastosCargando = false,
  rango = "mes",
}: {
  gastos: Gasto[];
  cargando?: boolean;
  rango?: RangoFecha;
}) {
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[] | null>(null);
  const [casa, setCasa] = useState("oficial");
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const cargadoRef = useRef(false);
  const cotizacionCargadaRef = useRef(false);

  useEffect(() => {
    if (cargadoRef.current) return;
    cargadoRef.current = true;
    fetch("/api/patrimonio", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.saldo) setSaldo(data.saldo);
      })
      .catch(() => setSaldo({ ARS: 0, USD: 0 }));
  }, []);

  const cargandoSaldo = saldo === null;
  const cargando = cargandoSaldo || gastosCargando;

  const cargarCotizaciones = useCallback(async (fuerza?: boolean) => {
    setRefrescando(true);
    try {
      const res = await fetch(
        `/api/cotizacion${fuerza ? `?r=${Date.now()}` : ""}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("fallo");
      const data = (await res.json()) as Cotizacion[];
      if (Array.isArray(data) && data.length > 0) setCotizaciones(data);
    } catch {
      // sin cotización se muestra degradado
    } finally {
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    if (cotizacionCargadaRef.current) return;
    cotizacionCargadaRef.current = true;
    void cargarCotizaciones();
  }, [cargarCotizaciones]);

  const cotizacion = cotizaciones?.find((c) => c.casa === casa) ?? null;
  const cotizacionNombre = cotizacion?.nombre ?? casa;
  const cotizacionCargando = cotizaciones === null;

  const elegirCasa = useCallback(
    (nueva: string) => {
      setCasa(nueva);
      setSelectorAbierto(false);
    },
    []
  );

  const datosMoneda = useCallback(
    (moneda: Moneda): DatosMoneda => {
      const saldoActual = saldo?.[moneda] ?? 0;
      const gastado = montoEnRango(gastos, moneda, "gasto", rango);
      const ingresado = montoEnRango(gastos, moneda, "ingreso", rango);
      return {
        saldoActual,
        gastado,
        ingresado,
        total: saldoActual + ingresado - gastado,
      };
    },
    [saldo, gastos, rango]
  );

  const totalARS = datosMoneda("ARS").total;
  const totalUSD = datosMoneda("USD").total;
  const patrimonioCombinado =
    cotizacion && !cargando
      ? totalARS + totalUSD * cotizacion.venta
      : null;

  const tarjeta = (moneda: Moneda, d: DatosMoneda) => {
    const esArs = moneda === "ARS";
    const { gastado, ingresado, total } = d;
    const enRojo = total < 0;
    return (
      <div
        className={cn(
          "relative min-w-0 w-[80%] shrink-0 snap-center overflow-hidden rounded-3xl border p-5 transition-all duration-300 lg:w-auto [scroll-snap-stop:always]",
          esArs
            ? "border-ars/30 bg-ars-soft"
            : "border-usd/30 bg-usd-soft"
        )}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "font-mono text-xs font-semibold tracking-widest",
              esArs ? "text-ars-strong" : "text-usd-strong"
            )}
          >
            {esArs ? "$ PESOS" : "U$S DÓLARES"}
          </span>
        </div>

        <p
          className={cn(
            "mt-2 font-display text-4xl font-semibold tracking-tight tabular-nums",
            enRojo ? "text-danger" : "text-ink"
          )}
        >
          {cargando ? (
            <span
              className="block h-10 w-40 rounded-xl skeleton"
              aria-hidden
            />
          ) : esArs ? (
            formatARS(total)
          ) : (
            formatUSD(total)
          )}
        </p>

        {!cargando && enRojo && (
          <p className="anim-fade-in mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-2.5 py-0.5 text-xs font-semibold text-danger">
            <span aria-hidden>▼</span> estás en rojo {etiquetaRango(rango)}
          </p>
        )}

        <div className="mt-3 space-y-0.5 text-sm text-sub">
          {cargando ? (
            <span className="block h-4 w-44 rounded-md skeleton" aria-hidden />
          ) : gastado > 0 ? (
            <p>
              Gastaste{" "}
              <span className="font-semibold text-ink">
                {formatMonto(gastado, moneda)}
              </span>{" "}
              {etiquetaRango(rango)}
            </p>
          ) : null}
          {cargando ? (
            <span className="block h-4 w-32 rounded-md skeleton" aria-hidden />
          ) : ingresado > 0 ? (
            <p>
              Ingresaste{" "}
              <span className="font-semibold text-ok">
                {formatMonto(ingresado, moneda)}
              </span>{" "}
              {etiquetaRango(rango)}
            </p>
          ) : null}
          {!cargando && gastado === 0 && ingresado === 0 && (
            <p>Nada cargado {etiquetaRango(rango)} todavía</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="anim-fade-up">
      <div className="relative mb-4 rounded-2xl border border-line bg-surface px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-sub">
            Balance total
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void cargarCotizaciones(true)}
              disabled={refrescando}
              aria-label="Actualizar cotizaciones del dólar"
              className="grid size-7 cursor-pointer place-items-center rounded-full text-sub transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-default disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                className={cn("size-4", refrescando && "animate-spin")}
                style={refrescando ? { animation: "spin-soft 0.8s linear infinite" } : undefined}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSelectorAbierto((v) => !v)}
                aria-expanded={selectorAbierto}
                aria-haspopup="listbox"
                aria-label="Elegir tipo de dólar"
                className="flex cursor-pointer items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium text-sub transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <span>
                  {cotizacionCargando ? "Dólar" : cotizacionNombre}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className={cn("size-3.5 transition-transform", selectorAbierto && "rotate-180")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {selectorAbierto && cotizaciones && (
                <>
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setSelectorAbierto(false)}
                    aria-hidden
                  />
                  <div
                    role="listbox"
                    aria-label="Tipo de dólar"
                    className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-2xl anim-pop-in"
                  >
                    {cotizaciones.map((c) => {
                      const activa = c.casa === casa;
                      return (
                        <button
                          key={c.casa}
                          type="button"
                          role="option"
                          aria-selected={activa}
                          onClick={() => elegirCasa(c.casa)}
                          className={cn(
                            "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                            activa
                              ? "bg-ars-soft text-ink"
                              : "text-sub hover:bg-surface-2 hover:text-ink"
                          )}
                        >
                          <span className="truncate font-medium">{c.nombre}</span>
                          <span className="shrink-0 font-mono text-xs tabular-nums text-usd-strong">
                            {formatARS(c.venta)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            {cotizacionCargando ? (
              <span className="h-4 w-14 rounded-md skeleton" aria-hidden />
            ) : cotizacion ? (
              <a
                href="https://dolarapi.com/docs/"
                target="_blank"
                rel="noreferrer"
                aria-label="Ver documentación de DolarAPI"
                className="cursor-pointer font-mono text-sm font-semibold tabular-nums text-usd-strong underline-offset-2 transition-colors hover:underline"
              >
                {formatARS(cotizacion.venta)}
              </a>
            ) : (
              <span className="font-mono text-sm text-faint">—</span>
            )}
          </div>
        </div>

        {cargando ? (
          <span className="mt-1.5 block h-8 w-48 rounded-lg skeleton" aria-hidden />
        ) : patrimonioCombinado !== null ? (
          <p className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {formatARS(patrimonioCombinado)}
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-faint">
            Sin cotización para combinar
          </p>
        )}
        {!cargando && (
          <p className="mt-1 text-[11px] text-faint">
            combinando pesos y dólares a {cotizacionNombre.toLowerCase()}
          </p>
        )}
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 no-scrollbar lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
        {tarjeta("ARS", datosMoneda("ARS"))}
        {tarjeta("USD", datosMoneda("USD"))}
      </div>
    </section>
  );
}
