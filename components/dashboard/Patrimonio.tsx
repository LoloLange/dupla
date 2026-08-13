"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Gasto, Moneda, MonedaSecundaria } from "@/lib/types";
import { infoMonedaSecundaria } from "@/lib/types";
import {
  formatARS,
  formatSecundaria,
  formatMonto,
  inicioDeRango,
  etiquetaRango,
  type RangoFecha,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  BloquearScroll,
  useContenidoScrollable,
} from "@/components/BloquearScroll";

type Saldo = { ARS: number; USD: number };
type Cotizacion = {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  moneda?: string;
};

type DatosTarjeta = { gastado: number; ingresado: number; total: number };

function totalesEn(
  gastos: Gasto[],
  rango: RangoFecha,
  destino: Moneda,
  convertir: (monto: number, desde: Moneda, hasta: Moneda) => number | null,
  incluir: (moneda: Moneda) => boolean = () => true
): DatosTarjeta {
  const desde = inicioDeRango(rango);
  let gastado = 0;
  let ingresado = 0;
  for (const g of gastos) {
    if (new Date(g.fecha) < desde) continue;
    if (!incluir(g.moneda)) continue;
    const valor = convertir(Number(g.monto), g.moneda, destino);
    if (valor === null) continue;
    if (g.tipo === "gasto") gastado += valor;
    else ingresado += valor;
  }
  return { gastado, ingresado, total: ingresado - gastado };
}

export function Patrimonio({
  gastos,
  cargando: gastosCargando = false,
  rango = "mes",
  monedaSecundaria = "USD",
  verDetalleMonedas = true,
  verBalance = true,
  preferenciasCargando = false,
}: {
  gastos: Gasto[];
  cargando?: boolean;
  rango?: RangoFecha;
  monedaSecundaria?: MonedaSecundaria | null;
  verDetalleMonedas?: boolean;
  verBalance?: boolean;
  preferenciasCargando?: boolean;
}) {
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [oficiales, setOficiales] = useState<Cotizacion[] | null>(null);
  const [dolares, setDolares] = useState<Cotizacion[] | null>(null);
  const [casa, setCasa] = useState("oficial");
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const cargadoRef = useRef(false);
  const monedaRef = useRef<MonedaSecundaria | null>(null);
  const oficialesRef = useRef<Cotizacion[] | null>(null);
  const dolaresRef = useRef<Cotizacion[] | null>(null);
  const listaDolarRef = useRef<HTMLDivElement>(null);
  useContenidoScrollable(listaDolarRef);

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

  const cargarCotizaciones = useCallback(async (fuerza = false) => {
    if (fuerza) setRefrescando(true);
    try {
      if (fuerza || !oficialesRef.current) {
        const res = await fetch("/api/cotizacion?oficiales=1", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as Cotizacion[];
          if (Array.isArray(data) && data.length > 0) {
            oficialesRef.current = data;
            setOficiales(data);
          }
        }
      }
      const moneda = monedaSecundaria;
      if (moneda === "USD") {
        if (fuerza || !dolaresRef.current || monedaRef.current !== "USD") {
          const res = await fetch("/api/cotizacion", { cache: "no-store" });
          if (res.ok) {
            const data = (await res.json()) as Cotizacion[];
            if (Array.isArray(data) && data.length > 0) {
              dolaresRef.current = data;
              setDolares(data);
            }
          }
        }
      } else if (moneda && monedaRef.current !== moneda) {
        dolaresRef.current = null;
        setDolares(null);
      }
      monedaRef.current = moneda ?? null;
    } catch {
      // sin cotización se muestra degradado
    } finally {
      if (fuerza) setRefrescando(false);
    }
  }, [monedaSecundaria]);

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) void cargarCotizaciones();
    });
    return () => {
      activo = false;
    };
  }, [cargarCotizaciones]);

  const esUsd = monedaSecundaria === "USD";
  const casaEfectiva =
    esUsd && dolares?.some((c) => c.casa === casa) ? casa : "oficial";
  const cotizacionUsd =
    dolares?.find((c) => c.casa === casaEfectiva) ??
    oficiales?.find((c) => c.moneda === "USD") ??
    null;
  const cotizacionSec = esUsd
    ? cotizacionUsd
    : (oficiales?.find((c) => c.moneda === monedaSecundaria) ?? null);
  const cotizacionNombre = cotizacionUsd?.nombre ?? casaEfectiva;
  const infoSecundaria = monedaSecundaria
    ? infoMonedaSecundaria(monedaSecundaria)
    : null;

  const tasaAARS = useCallback(
    (moneda: Moneda): number | null => {
      if (moneda === "ARS") return 1;
      if (moneda === "USD") return cotizacionUsd?.venta ?? null;
      return oficiales?.find((c) => c.moneda === moneda)?.venta ?? null;
    },
    [cotizacionUsd, oficiales]
  );

  const convertir = useCallback(
    (monto: number, desde: Moneda, hasta: Moneda): number | null => {
      if (desde === hasta) return monto;
      const tasaDesde = tasaAARS(desde);
      const tasaHasta = tasaAARS(hasta);
      if (tasaDesde === null || tasaHasta === null) return null;
      return (monto * tasaDesde) / tasaHasta;
    },
    [tasaAARS]
  );

  const elegirCasa = useCallback((nueva: string) => {
    setCasa(nueva);
    setSelectorAbierto(false);
  }, []);

  const cargandoSaldo = saldo === null;
  const cargando = cargandoSaldo || gastosCargando || preferenciasCargando;
  const cotizacionCargando = esUsd
    ? cotizacionUsd === null
    : monedaSecundaria
      ? cotizacionSec === null
      : oficiales === null;

  const datosArs = totalesEn(
    gastos,
    rango,
    "ARS",
    convertir,
    (m) => m === "ARS"
  );
  const datosSec = monedaSecundaria
    ? totalesEn(
        gastos,
        rango,
        monedaSecundaria,
        convertir,
        (m) => m !== "ARS"
      )
    : null;
  const totalArs = (saldo?.ARS ?? 0) + datosArs.total;

  const holdingsSec =
    monedaSecundaria && saldo
      ? monedaSecundaria === "USD"
        ? saldo.USD
        : (convertir(saldo.USD, "USD", monedaSecundaria) ?? 0)
      : 0;
  const totalSec =
    datosSec && monedaSecundaria ? holdingsSec + datosSec.total : null;

  let balance: number | null = null;
  if (!cargando && !cotizacionCargando) {
    if (monedaSecundaria && totalSec !== null) {
      const tasaSec = tasaAARS(monedaSecundaria);
      if (tasaSec !== null) {
        balance = totalArs + totalSec * tasaSec;
      }
    } else if (!monedaSecundaria) {
      balance = saldo?.ARS ?? 0;
      const tasaUsd = tasaAARS("USD");
      if (tasaUsd !== null) balance += (saldo?.USD ?? 0) * tasaUsd;
      const desde = inicioDeRango(rango);
      for (const g of gastos) {
        if (new Date(g.fecha) < desde) continue;
        const valor = convertir(Number(g.monto), g.moneda, "ARS");
        if (valor === null) continue;
        balance += g.tipo === "gasto" ? -valor : valor;
      }
    }
  }

  const tarjeta = ({
    esArs,
    gastado,
    ingresado,
    total,
  }: DatosTarjeta & { esArs: boolean }) => {
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
            {esArs
              ? "$ PESOS"
              : `${infoSecundaria?.simbolo ?? "U$S"} ${
                  infoSecundaria?.plural ?? "DÓLARES"
                }`}
          </span>
        </div>

        <p
          className={cn(
            "mt-2 font-display text-4xl font-semibold tracking-tight tabular-nums",
            enRojo ? "text-danger" : "text-ink"
          )}
        >
          {cargando ? (
            <span className="block h-10 w-40 rounded-xl skeleton" aria-hidden />
          ) : esArs ? (
            formatARS(total)
          ) : monedaSecundaria ? (
            formatSecundaria(total, monedaSecundaria)
          ) : (
            formatARS(total)
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
                {formatMonto(gastado, esArs ? "ARS" : (monedaSecundaria ?? "ARS"))}
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
                {formatMonto(ingresado, esArs ? "ARS" : (monedaSecundaria ?? "ARS"))}
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
      {preferenciasCargando && (
        <div className="relative mb-4 rounded-2xl border border-line bg-surface px-5 py-4">
          <span className="block h-3 w-28 rounded-md skeleton" aria-hidden />
          <span className="mt-3 block h-8 w-48 rounded-lg skeleton" aria-hidden />
        </div>
      )}
      {!preferenciasCargando && verBalance && (
      <div className="relative mb-4 rounded-2xl border border-line bg-surface px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-sub">
            Balance total
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {monedaSecundaria && (
              <button
                type="button"
                onClick={() => void cargarCotizaciones(true)}
                disabled={refrescando}
                aria-label="Actualizar cotizaciones"
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
            )}
            {esUsd && (
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

                {selectorAbierto && dolares && (
                  <>
                    <BloquearScroll
                      className="fixed inset-0 z-40 cursor-default [touch-action:none]"
                      onClick={() => setSelectorAbierto(false)}
                      ariaHidden
                    />
                    <div
                      ref={listaDolarRef}
                      role="listbox"
                      aria-label="Tipo de dólar"
                      className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-2xl anim-pop-in"
                    >
                      {dolares.map((c) => {
                        const activa = c.casa === casaEfectiva;
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
            )}
            {monedaSecundaria &&
              (cotizacionCargando ? (
                <span className="h-4 w-14 rounded-md skeleton" aria-hidden />
              ) : (esUsd ? cotizacionUsd : cotizacionSec) ? (
                <a
                  href="https://dolarapi.com/docs/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Ver documentación de DolarAPI"
                  className="cursor-pointer font-mono text-sm font-semibold tabular-nums text-usd-strong underline-offset-2 transition-colors hover:underline"
                >
                  {formatARS((esUsd ? cotizacionUsd : cotizacionSec)!.venta)}
                </a>
              ) : (
                <span className="font-mono text-sm text-faint">—</span>
              ))}
          </div>
        </div>

        {cargando || cotizacionCargando ? (
          <span className="mt-1.5 block h-8 w-48 rounded-lg skeleton" aria-hidden />
        ) : balance !== null ? (
          <p className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {formatARS(balance)}
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-faint">
            Sin cotización para combinar
          </p>
        )}
        {!cargando && monedaSecundaria && (
          <p className="mt-1 text-[11px] text-faint">
            combinando pesos y{" "}
            {(infoSecundaria?.plural ?? "dólares").toLowerCase()} a{" "}
            {esUsd
              ? cotizacionNombre.toLowerCase()
              : (cotizacionSec?.nombre ?? "oficial").toLowerCase()}
          </p>
        )}
      </div>
      )}

      {!preferenciasCargando && monedaSecundaria && verDetalleMonedas ? (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 no-scrollbar lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
          {tarjeta({ esArs: true, ...datosArs })}
          {totalSec !== null &&
            tarjeta({
              esArs: false,
              gastado: datosSec?.gastado ?? 0,
              ingresado: datosSec?.ingresado ?? 0,
              total: totalSec,
            })}
        </div>
      ) : null}

      {!preferenciasCargando && !verBalance && (!monedaSecundaria || !verDetalleMonedas) && (
        <p className="mt-2 text-sm text-faint">
          Elegí qué secciones mostrar desde Configuración.
        </p>
      )}
    </section>
  );
}
