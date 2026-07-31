"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GastoParseado, Moneda, Tipo } from "@/lib/types";
import { CATEGORIAS, esCategoria } from "@/lib/types";
import { cn, formatMonto } from "@/lib/utils";
import { Checkmark } from "@/components/voice/Checkmark";

type Fase = "edit" | "saving" | "done";

type Props = {
  abierto: boolean;
  gasto: GastoParseado | null;
  onConfirm: (gasto: GastoParseado) => Promise<void>;
  onCancel: () => void;
  onDone: () => void;
};

function aDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function ExpenseConfirmSheet({
  abierto,
  gasto,
  onConfirm,
  onCancel,
  onDone,
}: Props) {
  const [monto, setMonto] = useState(() => (gasto ? String(gasto.monto) : ""));
  const [moneda, setMoneda] = useState<Moneda>(() => gasto?.moneda ?? "ARS");
  const [tipo, setTipo] = useState<Tipo>(() => gasto?.tipo ?? "gasto");
  const [categoria, setCategoria] = useState(() =>
    gasto && esCategoria(gasto.categoria) ? gasto.categoria : "Otros"
  );
  const [descripcion, setDescripcion] = useState(() => gasto?.descripcion ?? "");
  const [fecha, setFecha] = useState(() =>
    gasto ? aDatetimeLocal(gasto.fecha) : ""
  );
  const [fase, setFase] = useState<Fase>("edit");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fase === "edit") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [abierto, fase, onCancel]);

  const montoNumerico = useMemo(() => {
    const n = Number(monto.replace(/[^0-9.,]/g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [monto]);

  const confirmar = useCallback(async () => {
    if (!montoNumerico || fase !== "edit") return;
    setFase("saving");
    setError(null);
    try {
      await onConfirm({
        monto: montoNumerico,
        moneda,
        tipo,
        categoria,
        descripcion: descripcion.trim() || categoria,
        fecha: new Date(fecha || Date.now()).toISOString(),
      });
      setFase("done");
      window.setTimeout(onDone, 1500);
    } catch (e) {
      console.error("Error guardando movimiento:", e);
      setError(
        e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo."
      );
      setFase("edit");
    }
  }, [montoNumerico, moneda, tipo, categoria, descripcion, fecha, fase, onConfirm, onDone]);

  if (!abierto || !gasto) return null;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <div
        className="anim-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => fase === "edit" && onCancel()}
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md">
        <div className="anim-sheet-up rounded-t-3xl border-t border-line bg-surface px-6 pb-8 pt-3 shadow-2xl">
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-line" />

          {fase === "done" ? (
            <div className="anim-pop-in flex flex-col items-center gap-4 py-10">
              <span className="grid size-24 place-items-center rounded-full bg-ok/15 text-ok">
                <Checkmark className="size-14" />
              </span>
              <p className="font-display text-2xl font-medium tracking-tight text-ink">
                ¡Anotado!
              </p>
              <p className="text-sub">
                {formatMonto(montoNumerico ?? 0, moneda)} · {descripcion}
              </p>
            </div>
          ) : (
            <div className="anim-fade-up">
              <div className="mb-1 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-sub">Dupla escuchó</p>
                  <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                    {tipo === "ingreso"
                      ? "¿Confirmás este ingreso?"
                      : "¿Confirmás este gasto?"}
                  </h2>
                </div>
              </div>
              <p className="mb-5 text-sm text-sub">
                Tocá lo que entendió mal y corregilo.
              </p>

              <div className="mb-4 flex rounded-2xl bg-surface-2 p-1.5">
                {(["gasto", "ingreso"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={cn(
                      "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                      tipo === t
                        ? t === "ingreso"
                          ? "bg-ok text-white shadow"
                          : "bg-ars text-white shadow"
                        : "text-sub hover:text-ink"
                    )}
                  >
                    {t === "ingreso" ? "Ingreso" : "Gasto"}
                  </button>
                ))}
              </div>

              <div className="mb-4 flex items-center gap-3">
                <div className="flex rounded-2xl bg-surface-2 p-1.5">
                  {(["ARS", "USD"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMoneda(m)}
                      className={cn(
                        "rounded-xl px-4 py-2 font-mono text-sm font-semibold transition-all",
                        moneda === m
                          ? m === "ARS"
                            ? "bg-ars text-white shadow"
                            : "bg-usd text-white shadow"
                          : "text-sub hover:text-ink"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <input
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  inputMode="decimal"
                  aria-label="Monto"
                  className="w-full min-w-0 flex-1 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-right font-display text-3xl font-semibold tracking-tight text-ink outline-none transition-colors focus:border-ars"
                />
              </div>

              <label className="mb-4 block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-sub">
                  Descripción
                </span>
                <input
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Supermercado Coto"
                  className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-ink outline-none transition-colors placeholder:text-faint focus:border-ars"
                />
              </label>

              <div className="mb-4">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-sub">
                  Categoría
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {CATEGORIAS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategoria(c)}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-all",
                        categoria === c
                          ? "border-ink bg-ink text-bg"
                          : "border-line text-sub hover:border-ink hover:text-ink"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mb-6 block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-sub">
                  Fecha
                </span>
                <input
                  type="datetime-local"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-ink outline-none transition-colors focus:border-ars"
                />
              </label>

              {error && (
                <p className="anim-fade-in mb-3 rounded-xl bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={fase === "saving"}
                  className="flex-1 rounded-2xl border border-line py-3.5 font-medium text-sub transition-colors hover:text-ink"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={confirmar}
                  disabled={!montoNumerico || fase === "saving"}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-white shadow-lg transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50",
                    tipo === "ingreso"
                      ? "bg-ok shadow-ok/25"
                      : "bg-ars shadow-ars/25"
                  )}
                >
                  {fase === "saving" ? (
                    <>
                      <span
                        className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                        style={{ animation: "spin-soft 0.8s linear infinite" }}
                      />
                      Guardando…
                    </>
                  ) : tipo === "ingreso" ? (
                    "Confirmar ingreso"
                  ) : (
                    "Confirmar gasto"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
