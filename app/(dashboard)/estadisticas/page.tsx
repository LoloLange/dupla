"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatMonto } from "@/lib/utils";
import type { Moneda } from "@/lib/types";
import { MONEDAS } from "@/lib/types";
import { emojiDeMovimiento } from "@/lib/categorias";

type CategoriaStat = { categoria: string; total: number };
type Comparacion = { actual: number; anterior: number; variacion: number };
type MesTendencia = {
  mes: string;
  etiqueta: string;
  total: number;
  fijos: number;
  variables: number;
};
type GastoDetalle = {
  id: string;
  monto: number;
  moneda: string;
  categoria: string;
  descripcion: string | null;
  fecha: string;
  tags: string[];
  comentario: string | null;
};
type TopGasto = {
  id: string;
  monto: number;
  moneda: string;
  categoria: string;
  descripcion: string | null;
  fecha: string;
};

type DatosMoneda = {
  porCategoria: CategoriaStat[];
  comparacionMes: Comparacion;
  comparacionSemana: Comparacion;
  tendenciaMensual: MesTendencia[];
  promedioDiario: number;
  topGastos: TopGasto[];
  fijos: number;
  variables: number;
  fijosMesAnterior: number;
  variablesMesAnterior: number;
};

type DatosAPI = {
  monedas: string[];
  rango: string;
} & Record<string, DatosMoneda>;

const COLORES_HEX: Record<string, string> = {
  Supermercado: "#22c55e",
  "Comida y bares": "#e11d48",
  Transporte: "#f59e0b",
  Vivienda: "#6366f1",
  Servicios: "#06b6d4",
  Salud: "#ec4899",
  Entretenimiento: "#8b5cf6",
  Suscripciones: "#14b8a6",
  Educación: "#f97316",
  Otros: "#94a3b8",
};

const COLOR_DEFAULT = "#94a3b8";

function colorCategoria(cat: string): string {
  return COLORES_HEX[cat] ?? COLOR_DEFAULT;
}

function useThemeColor(varName: string): string {
  const [color, setColor] = useState("#888");
  useEffect(() => {
    const el = document.documentElement;
    const read = () => {
      const v = getComputedStyle(el).getPropertyValue(varName).trim();
      if (v) setColor(v);
    };
    requestAnimationFrame(read);
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, [varName]);
  return color;
}

function Variacion({ valor }: { valor: number }) {
  const positivo = valor > 0;
  const neutro = Math.abs(valor) < 0.5;
  if (neutro) return <span className="text-xs text-sub">—</span>;
  return (
    <span
      className={`text-xs font-medium ${positivo ? "text-danger" : "text-ok"}`}
    >
      {positivo ? `+${Math.round(valor)}%` : `${Math.round(valor)}%`}
    </span>
  );
}

function StackedTooltip({
  active,
  payload,
  label,
  moneda,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  moneda?: Moneda;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-ink">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-sub">{p.name}</span>
          <span className="ml-auto font-medium tabular-nums text-ink">
            {formatMonto(p.value, moneda ?? "ARS")}
          </span>
        </div>
      ))}
    </div>
  );
}

const RANGOS = [
  { clave: "7d", etiqueta: "7 días" },
  { clave: "month", etiqueta: "Este mes" },
  { clave: "3m", etiqueta: "3 meses" },
  { clave: "1y", etiqueta: "Este año" },
  { clave: "all", etiqueta: "Todo" },
] as const;

function DonutChart({
  datos,
  moneda,
}: {
  datos: CategoriaStat[];
  moneda: Moneda;
}) {
  const total = datos.reduce((s, c) => s + c.total, 0);
  const [hovered, setHovered] = useState<CategoriaStat | null>(null);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative shrink-0">
        <ResponsiveContainer width={220} height={220}>
          <PieChart>
            <Pie
              data={datos}
              dataKey="total"
              nameKey="categoria"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={100}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={false}
              onMouseEnter={(_, index) => setHovered(datos[index] ?? null)}
              onMouseLeave={() => setHovered(null)}
            >
              {datos.map((entry) => (
                <Cell
                  key={entry.categoria}
                  fill={colorCategoria(entry.categoria)}
                  opacity={hovered && hovered.categoria !== entry.categoria ? 0.4 : 1}
                  style={{ transition: "opacity 120ms" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {hovered ? (
            <div className="text-center">
              <p className="text-[10px] text-sub">{hovered.categoria}</p>
              <p className="font-display text-lg font-semibold text-ink">
                {formatMonto(hovered.total, moneda)}
              </p>
              <p className="text-[10px] text-sub">
                {((hovered.total / total) * 100).toFixed(0)}%
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-display text-xl font-semibold text-ink">
                {formatMonto(total, moneda)}
              </p>
              <p className="text-[10px] text-sub">total</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {datos.map((cat) => (
          <div
            key={cat.categoria}
            className={`flex items-center gap-1.5 text-sm transition-opacity ${hovered && hovered.categoria !== cat.categoria ? "opacity-40" : ""}`}
          >
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: colorCategoria(cat.categoria) }}
            />
            <span className="text-ink">{cat.categoria}</span>
            <span className="text-sub">
              {((cat.total / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetalleCategoria({
  categoria,
  inicio,
  fin,
  onCerrar,
}: {
  categoria: string;
  inicio: string;
  fin: string;
  onCerrar: () => void;
}) {
  const [gastos, setGastos] = useState<GastoDetalle[] | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ categoria, inicio, fin });
    fetch(`/api/estadisticas?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { gastos: GastoDetalle[] }) => setGastos(d.gastos ?? []))
      .catch(() => setGastos([]))
      .finally(() => setCargando(false));
  }, [categoria, inicio, fin]);

  return (
    <div className="mt-3 rounded-xl border border-line bg-bg p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">
          {emojiDeMovimiento(categoria)} {categoria}
        </p>
        <button
          type="button"
          onClick={onCerrar}
          className="cursor-pointer text-xs text-sub hover:text-ink"
        >
          Cerrar
        </button>
      </div>
      {cargando ? (
        <div className="grid place-items-center py-4">
          <div className="size-5 animate-spin rounded-full border-2 border-line border-t-ars" />
        </div>
      ) : gastos && gastos.length > 0 ? (
        <div className="space-y-1.5">
          {gastos.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">
                  {g.descripcion || "Sin descripción"}
                </p>
                <p className="text-[11px] text-sub">
                  {new Date(g.fecha).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
              <p className="ml-3 shrink-0 text-sm font-medium tabular-nums text-ink">
                {formatMonto(g.monto, g.moneda as Moneda)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-2 text-center text-xs text-sub">Sin gastos</p>
      )}
    </div>
  );
}

function BarraCategoria({
  cat,
  maximo,
  moneda,
  expandida,
  onClick,
  inicioRango,
  finRango,
}: {
  cat: CategoriaStat;
  maximo: number;
  moneda: Moneda;
  expandida: boolean;
  onClick: () => void;
  inicioRango: string;
  finRango: string;
}) {
  const porcentaje = (cat.total / maximo) * 100;
  const emoji = emojiDeMovimiento(cat.categoria);

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className="w-full cursor-pointer rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">
                {cat.categoria}
              </span>
              <span className="text-sm tabular-nums text-sub">
                {formatMonto(cat.total, moneda)}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${porcentaje}%`,
                  backgroundColor: colorCategoria(cat.categoria),
                }}
              />
            </div>
          </div>
          <svg
            viewBox="0 0 24 24"
            className={`size-4 shrink-0 text-sub transition-transform ${expandida ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {expandida && (
        <DetalleCategoria
          categoria={cat.categoria}
          inicio={inicioRango}
          fin={finRango}
          onCerrar={onClick}
        />
      )}
    </div>
  );
}

export default function EstadisticasPage() {
  const [datos, setDatos] = useState<DatosAPI | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monedaActiva, setMonedaActiva] = useState<Moneda>("ARS");
  const [catExpandida, setCatExpandida] = useState<string | null>(null);
  const [rango, setRango] = useState<string>("month");
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/estadisticas?rango=${rango}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("No se pudieron cargar las estadísticas");
        return r.json();
      })
      .then((d: DatosAPI) => {
        setDatos(d);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Error de red");
      })
      .finally(() => setCargando(false));
  }, [rango]);

  const monedaEfectiva = useMemo<Moneda>(() => {
    if (datos?.monedas?.includes(monedaActiva)) return monedaActiva;
    if (datos?.monedas?.length) return datos.monedas[0] as Moneda;
    return monedaActiva;
  }, [datos, monedaActiva]);

  const datosMoneda = datos?.[monedaEfectiva] as DatosMoneda | undefined;

  const toggleCategoria = useCallback(
    (cat: string) => setCatExpandida((prev) => (prev === cat ? null : cat)),
    []
  );

  const ahora = useMemo(() => new Date(), []);

  const inicioRango = useMemo(() => {
    if (rango === "7d") {
      const d = new Date(ahora);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    if (rango === "3m") {
      return new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1).toISOString();
    }
    if (rango === "1y") {
      return new Date(ahora.getFullYear(), 0, 1).toISOString();
    }
    if (rango === "all") {
      return new Date(2020, 0, 1).toISOString();
    }
    return new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
  }, [rango, ahora]);

  const finRango = useMemo(() => {
    return new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59).toISOString();
  }, [ahora]);

  const monedasFiltrables = useMemo(() => {
    if (!datos) return [];
    return MONEDAS.filter((m) => datos.monedas?.includes(m.codigo));
  }, [datos]);

  const hayGastos = datosMoneda && datosMoneda.porCategoria.length > 0;

  const colorSub = useThemeColor("--sub");
  const colorSurface2 = useThemeColor("--surface-2");

  const handleExport = useCallback(async () => {
    if (!exportRef.current) return;
    try {
      const { toPng } = await import("html-to-image");

      const origDescriptor = Object.getOwnPropertyDescriptor(
        CSSStyleSheet.prototype,
        "cssRules"
      );
      Object.defineProperty(CSSStyleSheet.prototype, "cssRules", {
        get() {
          try {
            return origDescriptor?.get?.call(this) ?? [];
          } catch {
            return [];
          }
        },
        configurable: true,
      });

      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 1.5,
        cacheBust: true,
        style: { paddingBottom: "40px" },
      });

      if (origDescriptor) {
        Object.defineProperty(CSSStyleSheet.prototype, "cssRules", origDescriptor);
      }

      const link = document.createElement("a");
      link.download = `dupla-estadisticas-${rango}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error exporting", err);
    }
  }, [rango]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 lg:px-10 lg:pb-16 lg:pt-8">
      <div className="anim-fade-up">
        <Link
          href="/"
          aria-label="Volver al inicio"
          className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-sub shadow-sm transition-all hover:-translate-y-0.5 hover:text-ink active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-sub lg:text-sm">
              <Link href="/" className="transition-colors hover:text-ink">dupla</Link> | estadísticas
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink lg:text-5xl">
              Estadísticas
            </h1>
            <p className="mt-2 text-sm text-sub">
              Cómo se mueven tus pesos. Mes a mes, categoría a categoría.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="hidden shrink-0 cursor-pointer rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium text-sub shadow-sm transition-all hover:-translate-y-0.5 hover:text-ink active:scale-95 sm:block"
          >
            Exportar PNG
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {RANGOS.map((r) => (
            <button
              key={r.clave}
              type="button"
              onClick={() => {
                setRango(r.clave);
                setCargando(true);
                setCatExpandida(null);
              }}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                rango === r.clave
                  ? "border-ars bg-ars-soft text-ink shadow-sm"
                  : "border-line bg-surface text-sub hover:border-sub/50 hover:text-ink"
              }`}
            >
              {r.etiqueta}
            </button>
          ))}
        </div>

        {datos && monedasFiltrables.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {monedasFiltrables.map((m) => {
              const info = MONEDAS.find((x) => x.codigo === m.codigo);
              const activa = monedaEfectiva === m.codigo;
              return (
                <button
                  key={m.codigo}
                  type="button"
                  onClick={() => {
                    setMonedaActiva(m.codigo as Moneda);
                    setCatExpandida(null);
                  }}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    activa
                      ? "border-ars bg-ars-soft text-ink shadow-sm"
                      : "border-line bg-surface text-sub hover:border-sub/50 hover:text-ink"
                  }`}
                >
                  {info?.etiqueta ?? m.codigo}
                </button>
              );
            })}
          </div>
        )}

        {cargando && (
          <div className="mt-12 grid place-items-center py-20">
            <div className="size-8 animate-spin rounded-full border-2 border-line border-t-ars" />
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {datos && monedasFiltrables.length === 0 && !cargando && (
          <div className="mt-12 grid place-items-center py-20 text-center">
            <div>
              <p className="text-lg font-medium text-ink">No hay datos para mostrar</p>
              <p className="mt-1 text-sm text-sub">Cargá algunos gastos y volvé a mirar.</p>
            </div>
          </div>
        )}

        {datosMoneda && !cargando && (
          <div ref={exportRef} className="mt-8 space-y-8 pb-8">
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-xs font-medium text-sub">Total del período</p>
                <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {formatMonto(datosMoneda.comparacionMes.actual, monedaEfectiva)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Variacion valor={datosMoneda.comparacionMes.variacion} />
                  <span className="text-xs text-faint">vs. anterior</span>
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-xs font-medium text-sub">Promedio diario</p>
                <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {formatMonto(datosMoneda.promedioDiario, monedaEfectiva)}
                </p>
                <p className="mt-1 text-xs text-faint">por día</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-4 sm:col-span-2 lg:col-span-1">
                <p className="text-xs font-medium text-sub">Esta semana</p>
                <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {formatMonto(datosMoneda.comparacionSemana.actual, monedaEfectiva)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Variacion valor={datosMoneda.comparacionSemana.variacion} />
                  <span className="text-xs text-faint">vs. semana pasada</span>
                </div>
              </div>
            </section>

            {(datosMoneda.fijos > 0 || datosMoneda.variables > 0) && (
              <section>
                <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">
                  Fijos vs. variables
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-surface p-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-block size-3 rounded-full bg-[#6366f1]" />
                      <p className="text-xs font-medium text-sub">Gastos fijos</p>
                    </div>
                    <p className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                      {formatMonto(datosMoneda.fijos, monedaEfectiva)}
                    </p>
                    {datosMoneda.fijosMesAnterior > 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <Variacion
                          valor={
                            ((datosMoneda.fijos - datosMoneda.fijosMesAnterior) /
                              datosMoneda.fijosMesAnterior) *
                            100
                          }
                        />
                        <span className="text-xs text-faint">vs. anterior</span>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-sub">
                      {datosMoneda.comparacionMes.actual > 0
                        ? `${((datosMoneda.fijos / datosMoneda.comparacionMes.actual) * 100).toFixed(0)}%`
                        : "0%"}{" "}
                      del total
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface p-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-block size-3 rounded-full bg-[#f59e0b]" />
                      <p className="text-xs font-medium text-sub">Gastos variables</p>
                    </div>
                    <p className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                      {formatMonto(datosMoneda.variables, monedaEfectiva)}
                    </p>
                    {datosMoneda.variablesMesAnterior > 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <Variacion
                          valor={
                            ((datosMoneda.variables - datosMoneda.variablesMesAnterior) /
                              datosMoneda.variablesMesAnterior) *
                            100
                          }
                        />
                        <span className="text-xs text-faint">vs. anterior</span>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-sub">
                      {datosMoneda.comparacionMes.actual > 0
                        ? `${((datosMoneda.variables / datosMoneda.comparacionMes.actual) * 100).toFixed(0)}%`
                        : "0%"}{" "}
                      del total
                    </p>
                  </div>
                </div>
              </section>
            )}

            {hayGastos && (
              <section>
                <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">
                  Por categoría
                </h2>
                <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
                  <DonutChart datos={datosMoneda.porCategoria} moneda={monedaEfectiva} />
                </div>

                <div className="mt-4 rounded-2xl border border-line bg-surface divide-y divide-line">
                  {datosMoneda.porCategoria.map((cat) => (
                    <BarraCategoria
                      key={cat.categoria}
                      cat={cat}
                      maximo={datosMoneda.porCategoria[0].total}
                      moneda={monedaEfectiva}
                      expandida={catExpandida === cat.categoria}
                      onClick={() => toggleCategoria(cat.categoria)}
                      inicioRango={inicioRango}
                      finRango={finRango}
                    />
                  ))}
                </div>
              </section>
            )}

            {datosMoneda.topGastos.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">
                  Top gastos
                </h2>
                <div className="rounded-2xl border border-line bg-surface">
                  {datosMoneda.topGastos.map((g, i) => (
                    <div
                      key={g.id}
                      className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ars-soft font-display text-sm font-semibold text-ars">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {g.descripcion || "Sin descripción"}
                        </p>
                        <p className="text-[11px] text-sub">
                          {emojiDeMovimiento(g.categoria)} {g.categoria} ·{" "}
                          {new Date(g.fecha).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                        {formatMonto(g.monto, g.moneda as Moneda)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {datosMoneda.tendenciaMensual.length > 1 && (
              <section>
                <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">
                  Tendencia mensual
                </h2>
                <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={datosMoneda.tendenciaMensual}
                      margin={{ top: 5, right: 5, bottom: 5, left: -15 }}
                    >
                      <XAxis
                        dataKey="etiqueta"
                        tick={{ fontSize: 11, fill: colorSub }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: colorSub }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) =>
                          v >= 1_000_000
                            ? `${(v / 1_000_000).toFixed(0)}M`
                            : v >= 1_000
                              ? `${(v / 1_000).toFixed(0)}k`
                              : String(v)
                        }
                      />
                      <Tooltip
                        content={<StackedTooltip moneda={monedaEfectiva} />}
                        cursor={{ fill: colorSurface2, radius: 8 }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, color: colorSub }}
                      />
                      <Bar
                        dataKey="fijos"
                        name="Fijos"
                        stackId="gastos"
                        fill="#6366f1"
                        radius={[0, 0, 0, 0]}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="variables"
                        name="Variables"
                        stackId="gastos"
                        fill="#f59e0b"
                        radius={[6, 6, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
