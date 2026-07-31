"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Gasto, Moneda, Tipo } from "@/lib/types";
import { formatARS, formatUSD, formatMonto } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Saldo = { ARS: number; USD: number };

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

export function Patrimonio({ gastos }: { gastos: Gasto[] }) {
  const [saldo, setSaldo] = useState<Saldo>({ ARS: 0, USD: 0 });
  const [editando, setEditando] = useState<Moneda | null>(null);
  const [borrador, setBorrador] = useState("");
  const cargadoRef = useRef(false);

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

  const guardar = useCallback(async (moneda: Moneda) => {
    const valor = Number(borrador.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(valor) && valor >= 0) {
      setSaldo((s) => ({ ...s, [moneda]: valor }));
      await fetch(`/api/patrimonio?moneda=${moneda}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldo: valor }),
      });
    }
    setEditando(null);
  }, [borrador]);

  const tarjeta = (moneda: Moneda, saldoActual: number) => {
    const esArs = moneda === "ARS";
    const gastado = montoDelMes(gastos, moneda, "gasto");
    const ingresado = montoDelMes(gastos, moneda, "ingreso");
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border p-5 transition-all duration-300",
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
          <button
            type="button"
            aria-label={`Editar saldo en ${esArs ? "pesos" : "dólares"}`}
            onClick={() => {
              setEditando(moneda);
              setBorrador(String(saldoActual));
            }}
            className="text-sub transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {editando === moneda ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              autoFocus
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") guardar(moneda);
                if (e.key === "Escape") setEditando(null);
              }}
              inputMode="decimal"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 font-display text-2xl font-semibold tracking-tight text-ink outline-none focus:border-ars"
            />
            <button
              type="button"
              onClick={() => guardar(moneda)}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-bg"
            >
              OK
            </button>
          </div>
        ) : (
          <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink tabular-nums">
            {esArs ? formatARS(saldoActual) : formatUSD(saldoActual)}
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
      <div className="grid gap-4 sm:grid-cols-2">
        {tarjeta("ARS", saldo.ARS)}
        {tarjeta("USD", saldo.USD)}
      </div>
    </section>
  );
}
