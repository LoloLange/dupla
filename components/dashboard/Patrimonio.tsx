"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Gasto, Moneda, Tipo } from "@/lib/types";
import {
  formatARS,
  formatUSD,
  formatMonto,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

type Saldo = { ARS: number; USD: number };
type Cotizacion = { venta: number; compra: number; fecha: string };

function montoDelMes(gastos: Gasto[], moneda: Moneda, tipo: Tipo): number {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  return gastos
    .filter(
      (g) =>
        g.moneda === moneda &&
        g.tipo === tipo &&
        new Date(g.fecha) >= inicioMes
    )
    .reduce((acc, g) => acc + Number(g.monto), 0);
}

type DatosMoneda = {
  saldoActual: number;
  gastado: number;
  ingresado: number;
  total: number;
};

export function Patrimonio({ gastos }: { gastos: Gasto[] }) {
  const [saldo, setSaldo] = useState<Saldo>({ ARS: 0, USD: 0 });
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
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
      .catch(() => {});
  }, []);

  const cargarCotizacion = useCallback(async (fuerza?: boolean) => {
    setRefrescando(true);
    try {
      const res = await fetch(
        `/api/cotizacion${fuerza ? `?r=${Date.now()}` : ""}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("fallo");
      const data = (await res.json()) as Cotizacion;
      if (typeof data.venta === "number") setCotizacion(data);
    } catch {
      // sin cotización se muestra degradado
    } finally {
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    if (cotizacionCargadaRef.current) return;
    cotizacionCargadaRef.current = true;
    void cargarCotizacion();
  }, [cargarCotizacion]);

  const datosMoneda = useCallback(
    (moneda: Moneda): DatosMoneda => {
      const saldoActual = saldo[moneda];
      const gastado = montoDelMes(gastos, moneda, "gasto");
      const ingresado = montoDelMes(gastos, moneda, "ingreso");
      return {
        saldoActual,
        gastado,
        ingresado,
        total: saldoActual + ingresado - gastado,
      };
    },
    [saldo, gastos]
  );

  const totalARS = datosMoneda("ARS").total;
  const totalUSD = datosMoneda("USD").total;
  const patrimonioCombinado = cotizacion
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
          {esArs ? formatARS(total) : formatUSD(total)}
        </p>

        {enRojo && (
          <p className="anim-fade-in mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-2.5 py-0.5 text-xs font-semibold text-danger">
            <span aria-hidden>▼</span> estás en rojo este mes
          </p>
        )}

        <div className="mt-3 space-y-0.5 text-sm text-sub">
          {gastado > 0 && (
            <p>
              Gastaste{" "}
              <span className="font-semibold text-ink">
                {formatMonto(gastado, moneda)}
              </span>{" "}
              este mes
            </p>
          )}
          {ingresado > 0 && (
            <p>
              Ingresaste{" "}
              <span className="font-semibold text-ok">
                {formatMonto(ingresado, moneda)}
              </span>{" "}
              este mes
            </p>
          )}
          {gastado === 0 && ingresado === 0 && (
            <p>Nada cargado este mes todavía</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="anim-fade-up">
      <div className="mb-4 rounded-2xl border border-line bg-surface px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-sub">
            Patrimonio total
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void cargarCotizacion(true)}
              disabled={refrescando}
              aria-label="Actualizar cotización del dólar"
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
            <span className="text-xs font-medium text-sub">Dólar oficial</span>
            {cotizacion ? (
              <span className="font-mono text-sm font-semibold tabular-nums text-usd-strong">
                {formatARS(cotizacion.venta)}
              </span>
            ) : (
              <span className="font-mono text-sm text-faint">—</span>
            )}
          </div>
        </div>
        {patrimonioCombinado !== null ? (
          <p className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {formatARS(patrimonioCombinado)}
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-faint">
            Sin cotización para combinar
          </p>
        )}
        <p className="mt-1 text-[11px] text-faint">
          combinando pesos y dólares al oficial
        </p>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 no-scrollbar lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
        {tarjeta("ARS", datosMoneda("ARS"))}
        {tarjeta("USD", datosMoneda("USD"))}
      </div>
    </section>
  );
}
