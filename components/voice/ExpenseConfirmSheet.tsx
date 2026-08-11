"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GastoParseado,
  Moneda,
  Recurrencia,
  RecurrenciaFrecuencia,
  Tipo,
} from "@/lib/types";
import { CATEGORIAS, esCategoria, MONEDAS } from "@/lib/types";
import { cn, formatMonto } from "@/lib/utils";
import { Checkmark } from "@/components/voice/Checkmark";
import { NOMBRES_DIAS_SEMANA } from "@/lib/recurrencia";

type Fase = "edit" | "saving" | "done";

type Props = {
  abierto: boolean;
  gasto: (GastoParseado & { id?: string }) | null;
  onConfirm: (gasto: GastoParseado & { id?: string }) => Promise<void>;
  onCancel: () => void;
  onDone: () => void;
};

const FRECUENCIAS: { valor: RecurrenciaFrecuencia | null; etiqueta: string }[] = [
  { valor: null, etiqueta: "No se repite" },
  { valor: "mensual", etiqueta: "Cada mes" },
  { valor: "semanal", etiqueta: "Cada semana" },
];

type OpcionValor = string | number | null;

type Opcion = { valor: OpcionValor; etiqueta: string };

const DIAS_MES: Opcion[] = Array.from({ length: 31 }, (_, i) => ({
  valor: i + 1,
  etiqueta: String(i + 1),
}));

const DIAS_SEMANA_OPCIONES: Opcion[] = NOMBRES_DIAS_SEMANA.map((nombre, i) => ({
  valor: i,
  etiqueta: `${nombre != "domingo" && nombre != "sábado" ? nombre : nombre + "s"}`,
}));

function aDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function DropdownOpciones({
  abierto,
  onToggle,
  onCerrar,
  opciones,
  seleccionado,
  onElegir,
  ariaLabel,
}: {
  abierto: boolean;
  onToggle: () => void;
  onCerrar: () => void;
  opciones: Opcion[];
  seleccionado: OpcionValor;
  onElegir: (valor: OpcionValor) => void;
  ariaLabel: string;
}) {
  const etiquetaActual =
    opciones.find((o) => o.valor === seleccionado)?.etiqueta ?? "Elegir";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-ink outline-none transition-colors focus:border-ars"
      >
        <span className="truncate text-left font-medium">{etiquetaActual}</span>
        <svg
          viewBox="0 0 24 24"
          className={cn(
            "size-4 shrink-0 text-sub transition-transform",
            abierto && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {abierto && (
        <>
          <div
            className="fixed inset-0 z-40 cursor-default"
            onClick={onCerrar}
            aria-hidden
          />
          <div
            role="listbox"
            aria-label={ariaLabel}
            className="absolute inset-x-0 bottom-full z-50 mb-2 max-h-56 overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-2xl anim-pop-in"
          >
            {opciones.map((o) => {
              const activa = o.valor === seleccionado;
              return (
                <button
                  key={String(o.valor)}
                  type="button"
                  role="option"
                  aria-selected={activa}
                  onClick={() => {
                    onElegir(o.valor);
                    onCerrar();
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    activa
                      ? "bg-ars-soft text-ink"
                      : "text-sub hover:bg-surface-2 hover:text-ink"
                  )}
                >
                  <span className="font-medium">{o.etiqueta}</span>
                  {activa && (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4 shrink-0 text-ars"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function ExpenseConfirmSheet({
  abierto,
  gasto,
  onConfirm,
  onCancel,
  onDone,
}: Props) {
  const [monto, setMonto] = useState(() =>
    gasto && gasto.monto !== null ? String(gasto.monto) : "",
  );
  const [moneda, setMoneda] = useState<Moneda>(() => gasto?.moneda ?? "ARS");
  const [tipo, setTipo] = useState<Tipo>(() => gasto?.tipo ?? "gasto");
  const [categoria, setCategoria] = useState(() =>
    gasto && esCategoria(gasto.categoria) ? gasto.categoria : "Otros"
  );
  const [descripcion, setDescripcion] = useState(() => gasto?.descripcion ?? "");
  const [tags, setTags] = useState<string[]>(() => gasto?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [comentario, setComentario] = useState(() => gasto?.comentario ?? "");
  const [fecha, setFecha] = useState(() =>
    gasto ? aDatetimeLocal(gasto.fecha) : aDatetimeLocal(new Date().toISOString())
  );
  const [frecuencia, setFrecuencia] = useState<RecurrenciaFrecuencia | null>(
    () => gasto?.recurrencia?.frecuencia ?? null
  );
  const [diaMes, setDiaMes] = useState<number>(() => {
    const r = gasto?.recurrencia;
    if (r && r.frecuencia === "mensual") return r.diaMes;
    return new Date().getDate();
  });
  const [diaSemana, setDiaSemana] = useState<number>(() => {
    const r = gasto?.recurrencia;
    if (r && r.frecuencia === "semanal") return r.diaSemana;
    return new Date().getDay();
  });
  const [dropdownAbierto, setDropdownAbierto] = useState<
    "frecuencia" | "diaMes" | "diaSemana" | null
  >(null);
  const [masOpcionesAbierto, setMasOpcionesAbierto] = useState(false);
  const [pidiendoSalida, setPidiendoSalida] = useState(false);
  const [pidiendoAlcance, setPidiendoAlcance] = useState(false);
  const [fase, setFase] = useState<Fase>("edit");
  const [error, setError] = useState<string | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [arrastre, setArrastre] = useState(0);
  const [dragActivo, setDragActivo] = useState(false);
  const [saliendoArrastre, setSaliendoArrastre] = useState(false);
  const dragInicioRef = useRef<number | null>(null);
  const arrastreRef = useRef(0);

  const salir = useCallback(
    (cb: () => void) => {
      if (cerrando) return;
      setCerrando(true);
      window.setTimeout(cb, 320);
    },
    [cerrando]
  );

  const editando = !!gasto?.id;

  const hayCambios = useMemo(() => {
    if (!gasto) return false;
    if (String(gasto.monto ?? "") !== monto) return true;
    if ((gasto.moneda ?? "ARS") !== moneda) return true;
    if ((gasto.tipo ?? "gasto") !== tipo) return true;
    const origCategoria = esCategoria(gasto.categoria)
      ? gasto.categoria
      : "Otros";
    if (origCategoria !== categoria) return true;
    if ((gasto.descripcion ?? "") !== descripcion) return true;
    if (JSON.stringify(gasto.tags ?? []) !== JSON.stringify(tags)) return true;
    if ((gasto.comentario ?? "") !== comentario) return true;
    if (aDatetimeLocal(gasto.fecha) !== fecha) return true;
    if ((gasto.recurrencia?.frecuencia ?? null) !== frecuencia) return true;
    if (
      frecuencia === "mensual" &&
      gasto.recurrencia?.frecuencia === "mensual" &&
      gasto.recurrencia.diaMes !== diaMes
    )
      return true;
    if (
      frecuencia === "semanal" &&
      gasto.recurrencia?.frecuencia === "semanal" &&
      gasto.recurrencia.diaSemana !== diaSemana
    )
      return true;
    return false;
  }, [
    gasto,
    monto,
    moneda,
    tipo,
    categoria,
    descripcion,
    tags,
    comentario,
    fecha,
    frecuencia,
    diaMes,
    diaSemana,
  ]);

  const pedirSalir = useCallback(() => {
    if (editando && hayCambios) {
      setPidiendoSalida(true);
      return;
    }
    salir(onCancel);
  }, [editando, hayCambios, salir, onCancel]);

  const empezarArrastre = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (fase !== "edit" || e.pointerType !== "touch") return;
      dragInicioRef.current = e.clientY;
      setDragActivo(true);
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    [fase]
  );

  const moverArrastre = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragInicioRef.current == null) return;
    const siguiente = Math.max(0, e.clientY - dragInicioRef.current);
    arrastreRef.current = siguiente;
    setArrastre(siguiente);
  }, []);

  const soltarArrastre = useCallback(() => {
    if (dragInicioRef.current == null) return;
    dragInicioRef.current = null;
    const desplazado = arrastreRef.current;
    arrastreRef.current = 0;
    if (desplazado > 96) {
      setSaliendoArrastre(true);
      setDragActivo(false);
      setArrastre(window.innerHeight);
      window.setTimeout(() => {
        setArrastre(0);
        setSaliendoArrastre(false);
        pedirSalir();
      }, 320);
    } else {
      setDragActivo(false);
      setArrastre(0);
    }
  }, [pedirSalir]);

  useEffect(() => {
    if (!abierto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fase === "edit") pedirSalir();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [abierto, fase, pedirSalir]);

  const montoNumerico = useMemo(() => {
    const n = Number(monto.replace(/[^0-9.,]/g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [monto]);

  const esSerie = !!gasto?.id && gasto.recurrencia !== null;

  const construirRecurrencia = useCallback((): Recurrencia | null => {
    if (frecuencia === "semanal") {
      return { frecuencia: "semanal", intervalo: 1, diaSemana };
    }
    if (frecuencia === "mensual") {
      return { frecuencia: "mensual", intervalo: 1, diaMes };
    }
    return null;
  }, [frecuencia, diaSemana, diaMes]);

  const agregarTag = useCallback(() => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || t.length > 30 || tags.length >= 20) return;
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTagInput("");
  }, [tagInput, tags.length]);

  const quitarTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const guardar = useCallback(
    async (alcanceElegido?: "esta" | "todas") => {
      if (!montoNumerico || fase !== "edit") return;
      if (esSerie && !alcanceElegido) {
        setPidiendoAlcance(true);
        return;
      }
      setFase("saving");
      setError(null);
      try {
        const recurrencia =
          alcanceElegido === "esta" ? null : construirRecurrencia();
        await onConfirm({
          monto: montoNumerico,
          moneda,
          tipo,
          categoria,
          descripcion: descripcion.trim() || categoria,
          fecha: new Date(fecha || Date.now()).toISOString(),
          tags,
          comentario: comentario.trim(),
          ...(gasto?.id ? { recurrencia, id: gasto.id } : {}),
        });
        setFase("done");
        window.setTimeout(() => salir(onDone), 1200);
      } catch (e) {
        console.error("Error guardando movimiento:", e);
        setError(
          e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo."
        );
        setFase("edit");
      }
    },
    [montoNumerico, fase, esSerie, construirRecurrencia, moneda, tipo, categoria, descripcion, tags, comentario, fecha, gasto, onConfirm, onDone, salir]
  );

  if (!abierto) return null;

  const esManual = !gasto;
  const cantOpciones =
    tags.length +
    (comentario.trim() ? 1 : 0) +
    (editando && frecuencia ? 1 : 0);

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm",
          cerrando || saliendoArrastre ? "anim-fade-out" : "anim-fade-in"
        )}
        onClick={() => fase === "edit" && pedirSalir()}
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto max-w-md lg:inset-0 lg:flex lg:w-full lg:max-w-none lg:items-center lg:justify-center lg:px-6",
          dragActivo ? "transition-none" : "transition-transform duration-300 ease-out"
        )}
        style={arrastre > 0 ? { transform: `translateY(${arrastre}px)` } : undefined}
      >
        <div
          className={cn(
            "max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-6 pb-8 pt-3 shadow-2xl no-scrollbar lg:max-h-none lg:overflow-visible lg:w-full lg:max-w-lg lg:rounded-3xl lg:border lg:px-8 lg:pb-9 lg:pt-6",
            cerrando ? "anim-sheet-down lg:anim-pop-out" : "anim-sheet-up lg:anim-pop-in"
          )}
        >
          <div
            onPointerDown={empezarArrastre}
            onPointerMove={moverArrastre}
            onPointerUp={soltarArrastre}
            onPointerCancel={soltarArrastre}
            style={{ touchAction: "none" }}
            aria-hidden
            className="mx-auto mb-5 grid h-6 w-16 cursor-grab touch-none place-items-center active:cursor-grabbing lg:hidden"
          >
            <span className="block h-1.5 w-12 rounded-full bg-line" />
          </div>

          {fase === "done" ? (
            <div className="anim-pop-in flex flex-col items-center gap-4 py-10">
              <span className="grid size-24 place-items-center rounded-full bg-ok/15 text-ok">
                <Checkmark className="size-14" />
              </span>
              <p className="font-display text-2xl font-medium tracking-tight text-ink">
                {editando ? "¡Actualizado!" : "¡Anotado!"}
              </p>
              <p className="text-sub">
                {formatMonto(montoNumerico ?? 0, moneda)} | {descripcion}
              </p>
            </div>
          ) : (
            <div className="anim-fade-up">
              <div className="mb-1 flex items-start justify-between gap-3">
                <div>
                  {!esManual && !editando && (
                    <p className="text-sm font-medium text-sub">
                      Dupla escuchó
                    </p>
                  )}
                  <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                    {editando
                      ? "Editar movimiento"
                      : esManual
                        ? "Cargar un movimiento"
                        : tipo === "ingreso"
                          ? "¿Confirmás este ingreso?"
                          : "¿Confirmás este gasto?"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => pedirSalir()}
                  disabled={fase === "saving"}
                  aria-label="Cerrar"
                  className="hidden size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-line text-sub transition-colors hover:bg-surface-2 hover:text-ink lg:grid"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <p className="mb-5 text-sm text-sub">
                {editando
                  ? "Corregí lo que quieras y guardá los cambios."
                  : esManual
                    ? "Completá los datos y guardalo."
                    : "Tocá lo que entendió mal y corregilo."}
              </p>

              {gasto && gasto.monto === null && (
                <div className="anim-fade-in mb-4 flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3">
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 size-4 shrink-0 text-danger"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                    />
                  </svg>
                  <p className="text-sm text-danger">
                    No reconocí ningún monto. Completá el monto a mano.
                  </p>
                </div>
              )}

              <div className="mb-4 flex rounded-2xl bg-surface-2 p-1.5">
                {(["gasto", "ingreso"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all",
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
                <div className="flex flex-wrap rounded-2xl bg-surface-2 p-1.5">
                  {MONEDAS.map(({ codigo: m }) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMoneda(m)}
                      className={cn(
                        "cursor-pointer rounded-xl px-3 py-2 font-mono text-sm font-semibold transition-all",
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
                        "shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-all",
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

              <button
                type="button"
                onClick={() => {
                  setMasOpcionesAbierto((v) => !v);
                  setDropdownAbierto(null);
                }}
                aria-expanded={masOpcionesAbierto}
                className="mb-6 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-ink outline-none transition-colors focus:border-ars"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  Más opciones
                  {cantOpciones > 0 && (
                    <span className="rounded-full bg-ars-soft px-2 py-0.5 text-[11px] font-semibold text-ars-strong">
                      {cantOpciones}
                    </span>
                  )}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className={cn(
                    "size-4 shrink-0 text-sub transition-transform",
                    masOpcionesAbierto && "rotate-180"
                  )}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {masOpcionesAbierto && (
                <div className="anim-fade-in">
                  <div className="mb-4">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-sub">
                      Tags
                    </span>
                    {tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink"
                          >
                            {t}
                            <button
                              type="button"
                              aria-label={`Quitar tag ${t}`}
                              onClick={() => quitarTag(t)}
                              className="grid size-4 cursor-pointer place-items-center rounded-full text-faint transition-colors hover:bg-danger/15 hover:text-danger"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="size-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            agregarTag();
                          }
                        }}
                        placeholder="Ej: trabajo, urgente…"
                        maxLength={30}
                        className="min-w-0 flex-1 rounded-2xl border border-line bg-surface-2 px-4 py-2 text-ink outline-none transition-colors placeholder:text-faint focus:border-ars"
                      />
                      <button
                        type="button"
                        onClick={agregarTag}
                        disabled={!tagInput.trim() || tags.length >= 20}
                        className="shrink-0 cursor-pointer rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-bg transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-default disabled:opacity-40"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-sub">
                      Comentario
                    </span>
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Escribe un comentario…"
                      rows={2}
                      maxLength={500}
                      className="w-full resize-none rounded-2xl border border-line bg-surface-2 px-4 py-3 text-ink outline-none transition-colors placeholder:text-faint focus:border-ars"
                    />
                  </div>

                  {editando && (
                    <div className="mb-6">
                      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-sub">
                        Se repite
                      </span>
                      <div className="flex flex-col gap-2.5">
                        <DropdownOpciones
                          abierto={dropdownAbierto === "frecuencia"}
                          onToggle={() =>
                            setDropdownAbierto((v) =>
                              v === "frecuencia" ? null : "frecuencia"
                            )
                          }
                          onCerrar={() => setDropdownAbierto(null)}
                          opciones={FRECUENCIAS}
                          seleccionado={frecuencia}
                          onElegir={(v) =>
                            setFrecuencia(v as RecurrenciaFrecuencia | null)
                          }
                          ariaLabel="Frecuencia de repetición"
                        />
                        {frecuencia === "mensual" && (
                          <div className="anim-fade-in flex items-center gap-2.5">
                            <span className="shrink-0 text-sm text-sub">el día</span>
                            <div className="flex-1 max-w-fit">
                              <DropdownOpciones
                                abierto={dropdownAbierto === "diaMes"}
                                onToggle={() =>
                                  setDropdownAbierto((v) =>
                                    v === "diaMes" ? null : "diaMes"
                                  )
                                }
                                onCerrar={() => setDropdownAbierto(null)}
                                opciones={DIAS_MES}
                                seleccionado={diaMes}
                                onElegir={(v) => setDiaMes(Number(v))}
                                ariaLabel="Día del mes"
                              />
                            </div>
                          </div>
                        )}
                        {frecuencia === "semanal" && (
                          <div className="anim-fade-in flex items-center gap-2.5">
                            <span className="shrink-0 text-sm text-sub">los</span>
                            <div className="flex-1 max-w-fit">
                              <DropdownOpciones
                                abierto={dropdownAbierto === "diaSemana"}
                                onToggle={() =>
                                  setDropdownAbierto((v) =>
                                    v === "diaSemana" ? null : "diaSemana"
                                  )
                                }
                                onCerrar={() => setDropdownAbierto(null)}
                                opciones={DIAS_SEMANA_OPCIONES}
                                seleccionado={diaSemana}
                                onElegir={(v) => setDiaSemana(Number(v))}
                                ariaLabel="Día de la semana"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <p className="anim-fade-in mb-3 rounded-xl bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => salir(onCancel)}
                  disabled={fase === "saving"}
                  className="flex-1 cursor-pointer rounded-2xl border border-line py-2 font-medium text-sub transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-default disabled:opacity-50"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={() => void guardar()}
                  disabled={!montoNumerico || fase === "saving"}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl py-2 font-semibold text-white shadow-lg transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-default disabled:opacity-50",
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
                  ) : editando ? (
                    "Guardar cambios"
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

      {pidiendoAlcance && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/60 px-6 backdrop-blur-sm anim-fade-in">
          <div className="anim-pop-in w-full max-w-sm rounded-3xl border border-line bg-surface p-5 shadow-2xl">
            <h3 className="font-display text-xl font-medium tracking-tight text-ink">
              ¿Qué querés editar?
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-sub">
              Este movimiento se repite. ¿El cambio aplica solo a esta ocasión
              o desde ahora en adelante?
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPidiendoAlcance(false);
                  void guardar("esta");
                }}
                className="cursor-pointer rounded-2xl bg-ars py-3 font-semibold text-white shadow-lg transition-all hover:brightness-105 active:scale-[0.98]"
              >
                Solo esta ocasión
              </button>
              <button
                type="button"
                onClick={() => {
                  setPidiendoAlcance(false);
                  void guardar("todas");
                }}
                className="cursor-pointer rounded-2xl bg-ink py-3 font-semibold text-bg transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Desde ahora en adelante
              </button>
              <button
                type="button"
                onClick={() => setPidiendoAlcance(false)}
                className="cursor-pointer rounded-2xl border border-line py-3 font-medium text-sub transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {pidiendoSalida && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/60 px-6 backdrop-blur-sm anim-fade-in">
          <div className="anim-pop-in w-full max-w-sm rounded-3xl border border-line bg-surface p-5 shadow-2xl">
            <h3 className="font-display text-xl font-medium tracking-tight text-ink">
              ¿Guardar los cambios?
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-sub">
              Hiciste cambios en este movimiento. Si salís sin guardar, se
              pierden.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPidiendoSalida(false);
                  void guardar();
                }}
                className="cursor-pointer rounded-2xl bg-ars py-3 font-semibold text-white shadow-lg transition-all hover:brightness-105 active:scale-[0.98]"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={() => {
                  setPidiendoSalida(false);
                  salir(onCancel);
                }}
                className="cursor-pointer rounded-2xl border border-line py-3 font-medium text-sub transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Descartar cambios
              </button>
              <button
                type="button"
                onClick={() => setPidiendoSalida(false)}
                className="cursor-pointer rounded-2xl border border-line py-3 font-medium text-sub transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
