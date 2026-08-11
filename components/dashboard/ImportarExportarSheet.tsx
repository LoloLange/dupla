"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Gasto, GastoInput } from "@/lib/types";
import {
  analizarArchivo,
  autoMapear,
  construirGastos,
  gastosACsv,
  gastosAXlsx,
  type FormatoArchivo,
  type MapeoHoja,
} from "@/lib/archivos";
import { MapeoImportacion } from "@/components/dashboard/MapeoImportacion";
import { cn } from "@/lib/utils";

type Modo = "importar" | "exportar";
type Estado = "idle" | "analizando" | "mapeo" | "importando" | "exportando" | "resultado";
type FiltroTipo = "ambos" | "ingreso" | "gasto";

const OPCIONES_FILTRO: { id: FiltroTipo; etiqueta: string }[] = [
  { id: "ambos", etiqueta: "Ingresos y egresos" },
  { id: "ingreso", etiqueta: "Solo ingresos" },
  { id: "gasto", etiqueta: "Solo egresos" },
];

export type ResultadoImportar = {
  importados: number;
  fallidos: number;
};

export function ImportarExportarSheet({
  abierto,
  onCancel,
  onImportar,
}: {
  abierto: boolean;
  onCancel: () => void;
  onImportar: (movimientos: GastoInput[]) => Promise<ResultadoImportar>;
}) {
  const [modo, setModo] = useState<Modo>("importar");
  const [formato, setFormato] = useState<FormatoArchivo>("csv");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [estado, setEstado] = useState<Estado>("idle");
  const [mapeos, setMapeos] = useState<MapeoHoja[] | null>(null);
  const [resultado, setResultado] = useState<{
    importados?: number;
    fallidos?: number;
    mensaje: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("ambos");
  const inputRef = useRef<HTMLInputElement>(null);

  const resultadoLive = useMemo(
    () => construirGastos(mapeos ?? []),
    [mapeos]
  );

  const aImportar = useMemo(() => {
    if (filtroTipo === "ambos") return resultadoLive.datos;
    return resultadoLive.datos.filter((g) => g.tipo === filtroTipo);
  }, [resultadoLive, filtroTipo]);

  useEffect(() => {
    if (!abierto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [abierto, onCancel]);

  if (!abierto) return null;

  const analizar = async (file: File) => {
    setError(null);
    setResultado(null);
    setArchivo(file);
    setEstado("analizando");
    try {
      const analizado = await analizarArchivo(file);
      const hojasConDatos = analizado.hojas.filter((h) => h.filas.length > 0);
      if (hojasConDatos.length === 0) {
        setError("El archivo no tiene filas con datos para importar.");
        setArchivo(null);
        setMapeos(null);
        setEstado("idle");
        return;
      }
      setMapeos(hojasConDatos.map((h) => autoMapear(h)));
      setEstado("mapeo");
    } catch {
      setError("No se pudo leer el archivo. Verificá que sea un .csv o .xlsx válido.");
      setArchivo(null);
      setMapeos(null);
      setEstado("idle");
    }
  };

  const manejarArchivo = (file: File) => {
    const nombre = file.name.toLowerCase();
    if (nombre.endsWith(".csv")) setFormato("csv");
    else if (nombre.endsWith(".xlsx")) setFormato("excel");
    else {
      setError("El archivo debe ser .csv o .xlsx");
      return;
    }
    void analizar(file);
  };

  const importar = async () => {
    if (!mapeos || aImportar.length === 0) return;
    setEstado("importando");
    setError(null);
    try {
      const { importados, fallidos } = await onImportar(aImportar);
      setResultado({
        importados,
        fallidos,
        mensaje:
          fallidos > 0
            ? `Se importaron ${importados} movimientos y ${fallidos} no se pudieron guardar.`
            : `Se importaron ${importados} movimientos.`,
      });
    } catch {
      setResultado({
        importados: 0,
        fallidos: aImportar.length,
        mensaje: "No se pudo importar. Probá de nuevo.",
      });
    }
    setEstado("resultado");
  };

  const exportar = async () => {
    setEstado("exportando");
    setError(null);
    try {
      const res = await fetch("/api/gastos?exportar=1", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron cargar los movimientos");
      const data = (await res.json()) as { gastos: Gasto[] };
      const gastos = data.gastos ?? [];
      if (gastos.length === 0) {
        setResultado({
          mensaje: "Todavía no tenés movimientos para exportar.",
        });
        setEstado("resultado");
        return;
      }
      const hoy = new Date().toISOString().slice(0, 10);
      const ext = formato === "csv" ? "csv" : "xlsx";
      const blob =
        formato === "csv"
          ? new Blob(["\ufeff" + gastosACsv(gastos)], {
              type: "text/csv;charset=utf-8",
            })
          : await gastosAXlsx(gastos);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dupla-movimientos-${hoy}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setResultado({
        mensaje: `Se exportaron ${gastos.length} movimientos en formato ${ext.toUpperCase()}.`,
      });
      setEstado("resultado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo exportar.");
      setEstado("idle");
    }
  };

  const cambiarModo = (m: Modo) => {
    setModo(m);
    setArchivo(null);
    setMapeos(null);
    setResultado(null);
    setError(null);
    setEstado("idle");
  };

  const ocupado =
    estado === "analizando" || estado === "importando" || estado === "exportando";
  const validos = aImportar.length;
  const invalidos = resultadoLive.errores.length;
  const monedasAsumidas = resultadoLive.monedasAsumidas;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm anim-fade-in"
        onClick={() => !ocupado && onCancel()}
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md lg:inset-0 lg:flex lg:w-full lg:max-w-none lg:items-center lg:justify-center lg:px-6">
        <div className="anim-sheet-up lg:anim-pop-in max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-6 pb-8 pt-3 shadow-2xl no-scrollbar lg:max-h-none lg:overflow-visible lg:w-full lg:max-w-2xl lg:rounded-3xl lg:border lg:px-8 lg:pb-9 lg:pt-6">
          <div
            aria-hidden
            className="mx-auto mb-5 grid h-6 w-16 place-items-center lg:hidden"
          >
            <span className="block h-1.5 w-12 rounded-full bg-line" />
          </div>

          {estado === "resultado" && resultado ? (
            <div className="anim-pop-in flex flex-col items-center gap-4 py-10">
              <span className="grid size-24 place-items-center rounded-full bg-ok/15 text-ok">
                <svg
                  viewBox="0 0 24 24"
                  className="size-14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="font-display text-2xl font-medium tracking-tight text-ink">
                ¡Listo!
              </p>
              <p className="text-center text-sm text-sub">{resultado.mensaje}</p>
              <button
                type="button"
                onClick={onCancel}
                className="mt-4 w-full cursor-pointer rounded-2xl bg-ink py-3 font-semibold text-bg transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="anim-fade-up">
              <div className="mb-1 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                    Importar y exportar
                  </h2>
                  <p className="mt-1 text-sm text-sub">
                    Movimientos desde o hacia un archivo CSV o Excel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={ocupado}
                  aria-label="Cerrar"
                  className="hidden size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-line text-sub transition-colors hover:bg-surface-2 hover:text-ink lg:grid"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 mb-4 flex rounded-2xl bg-surface-2 p-1.5">
                {(["importar", "exportar"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={ocupado}
                    onClick={() => cambiarModo(m)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                      modo === m
                        ? "bg-surface text-ink shadow"
                        : "text-sub hover:text-ink"
                    )}
                  >
                    {m === "importar" ? "Importar" : "Exportar"}
                  </button>
                ))}
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {(["csv", "excel"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setFormato(f)}
                    className={cn(
                      "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      formato === f
                        ? "border-ink bg-ink text-bg"
                        : "border-line text-sub hover:border-ink hover:text-ink"
                    )}
                  >
                    {f === "csv" ? "CSV" : "Excel (.xlsx)"}
                  </button>
                ))}
              </div>

              {modo === "importar" ? (
                <div>
                  {estado === "analizando" || estado === "importando" ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface-2 px-6 py-10 text-center">
                      <span className="size-8 animate-spin rounded-full border-2 border-line border-t-ars" aria-hidden />
                      <p className="text-sm text-sub">
                        {estado === "analizando"
                          ? "Analizando el archivo…"
                          : "Guardando movimientos…"}
                      </p>
                    </div>
                  ) : estado === "mapeo" && mapeos ? (
                    <div className="anim-fade-up">
                      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">
                            {archivo?.name}
                          </p>
                          <p className="mt-0.5 text-xs text-sub">
                            Revisá que cada campo use la columna correcta. Cada
                            columna solo puede usarse una vez.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          className="shrink-0 cursor-pointer rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-sub transition-colors hover:bg-surface hover:text-ink"
                        >
                          Otro archivo
                        </button>
                      </div>

                      <div className="no-scrollbar -mx-1 max-h-[38dvh] space-y-4 overflow-y-auto px-1 pb-1 lg:max-h-[52dvh]">
                        <MapeoImportacion
                          mapeos={mapeos}
                          onChange={setMapeos}
                        />
                      </div>

                      <div className="mt-4">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                          Qué importar
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {OPCIONES_FILTRO.map((op) => (
                            <button
                              key={op.id}
                              type="button"
                              onClick={() => setFiltroTipo(op.id)}
                              aria-pressed={filtroTipo === op.id}
                              className={cn(
                                "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.97]",
                                filtroTipo === op.id
                                  ? "border-ink bg-ink text-bg shadow-sm"
                                  : "border-line bg-surface text-sub hover:border-ink hover:text-ink"
                              )}
                            >
                              {op.etiqueta}
                            </button>
                          ))}
                        </div>
                        {filtroTipo !== "ambos" && (
                          <p className="mt-1.5 text-[11px] text-faint">
                            Se van a ignorar los{" "}
                            {filtroTipo === "ingreso" ? "egresos" : "ingresos"}{" "}
                            detectados en el archivo.
                          </p>
                        )}
                      </div>

                      {monedasAsumidas > 0 && (
                        <p className="mt-3 rounded-xl border border-ok/30 bg-ok/10 px-3 py-2 text-xs text-ok">
                          {monedasAsumidas}{" "}
                          {monedasAsumidas === 1
                            ? "movimiento no tiene"
                            : "movimientos no tienen"}{" "}
                          moneda reconocible: se importarán en pesos (ARS).
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => void importar()}
                        disabled={validos === 0}
                        className="mt-4 w-full cursor-pointer rounded-2xl bg-ars py-3 font-semibold text-white shadow-lg transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {validos > 0
                          ? `Importar ${validos} movimiento${validos !== 1 ? "s" : ""}`
                          : "No hay movimientos válidos para importar"}
                      </button>
                      {invalidos > 0 && (
                        <p className="mt-2 text-center text-[11px] text-danger">
                          {invalidos} fila{invalidos !== 1 ? "s" : ""} se va
                          {invalidos !== 1 ? "n" : ""} a omitir por error.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!ocupado) setArrastrando(true);
                      }}
                      onDragLeave={() => setArrastrando(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setArrastrando(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) manejarArchivo(file);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                        arrastrando
                          ? "border-ars bg-ars-soft"
                          : "border-line bg-surface-2/60"
                      )}
                    >
                      <span className="grid size-12 place-items-center rounded-2xl bg-surface text-xl text-sub">
                        📄
                      </span>
                      <div>
                        <p className="font-medium text-ink">
                          Arrastrá tu archivo acá
                        </p>
                        <p className="mt-0.5 text-xs text-sub">
                          o seleccionalo desde tu dispositivo
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="cursor-pointer rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-bg transition-all hover:brightness-110 active:scale-[0.98]"
                      >
                        Elegir archivo
                      </button>
                      <p className="text-[11px] text-faint">
                        Formatos admitidos: CSV y Excel (.xlsx). Si el Excel
                        tiene varias hojas (ej: expenses e income), se importan
                        todas.
                      </p>
                    </div>
                  )}

                  {error && (
                    <p className="anim-fade-in mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                      {error}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="rounded-2xl border border-line bg-surface-2/60 px-4 py-3">
                    <p className="text-sm text-sub">
                      Se va a descargar un archivo{" "}
                      <span className="font-semibold text-ink">
                        {formato.toUpperCase()}
                      </span>{" "}
                      con <span className="font-semibold text-ink">todos</span>{" "}
                      tus movimientos.
                    </p>
                  </div>

                  {estado === "exportando" ? (
                    <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface-2 px-6 py-10 text-center">
                      <span className="size-8 animate-spin rounded-full border-2 border-line border-t-ars" aria-hidden />
                      <p className="text-sm text-sub">Generando archivo…</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void exportar()}
                      className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-ars py-3 font-semibold text-white shadow-lg transition-all hover:brightness-105 active:scale-[0.98]"
                    >
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Descargar {formato.toUpperCase()}
                    </button>
                  )}

                  {error && (
                    <p className="anim-fade-in mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) manejarArchivo(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
