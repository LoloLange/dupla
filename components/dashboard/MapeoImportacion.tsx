"use client";

import { useMemo } from "react";
import {
  CAMPOS_MAPEO,
  ETIQUETA_MAPEO,
  construirGastos,
  faltanObligatorios,
  type CampoMapeo,
  type MapeoHoja,
  type TipoHoja,
} from "@/lib/archivos";
import { cn, formatMonto } from "@/lib/utils";

const OPCIONES_TIPO: { id: TipoHoja; etiqueta: string; descripcion: string }[] = [
  {
    id: "auto",
    etiqueta: "Detectar",
    descripcion: "Usa la columna Tipo o el signo del monto.",
  },
  {
    id: "ingreso",
    etiqueta: "Solo ingresos",
    descripcion: "Todos los movimientos de la hoja son ingresos.",
  },
  {
    id: "gasto",
    etiqueta: "Solo gastos",
    descripcion: "Todos los movimientos de la hoja son gastos.",
  },
];

function formatearFechaPreview(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(+d)) return iso;
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    ...(d.getHours() || d.getMinutes()
      ? { hour: "2-digit", minute: "2-digit" }
      : {}),
  });
}

export function MapeoImportacion({
  mapeos,
  onChange,
}: {
  mapeos: MapeoHoja[];
  onChange: (mapeos: MapeoHoja[]) => void;
}) {
  const actualizar = (idx: number, nuevo: MapeoHoja) => {
    onChange(mapeos.map((m, i) => (i === idx ? nuevo : m)));
  };

  return (
    <div className="anim-fade-up space-y-5">
      {mapeos.map((mapeo, idx) => (
        <TarjetaHoja
          key={`${mapeo.hoja.nombre}-${idx}`}
          mapeo={mapeo}
          onChange={(nuevo) => actualizar(idx, nuevo)}
        />
      ))}
    </div>
  );
}

function TarjetaHoja({
  mapeo,
  onChange,
}: {
  mapeo: MapeoHoja;
  onChange: (mapeo: MapeoHoja) => void;
}) {
  const { hoja, tipoHoja, asignacion } = mapeo;
  const resultado = useMemo(() => construirGastos([mapeo]), [mapeo]);
  const faltan = faltanObligatorios(asignacion);
  const completa = faltan.length === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface-2/60">
      <div className="border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="min-w-0 truncate font-display text-base font-medium tracking-tight text-ink">
            {hoja.nombre || "Hoja"}
          </h3>
          <span className="shrink-0 rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-sub">
            {hoja.filas.length} fila{hoja.filas.length !== 1 ? "s" : ""}
          </span>
        </div>

        <p className="mb-1.5 mt-3 text-[11px] font-semibold uppercase tracking-wide text-faint">
          Tipo de movimientos
        </p>
        <div className="flex flex-wrap gap-1.5">
          {OPCIONES_TIPO.map((op) => (
            <button
              key={op.id}
              type="button"
              onClick={() => onChange({ ...mapeo, tipoHoja: op.id })}
              aria-pressed={tipoHoja === op.id}
              title={op.descripcion}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.97]",
                tipoHoja === op.id
                  ? "border-ink bg-ink text-bg shadow-sm"
                  : "border-line bg-surface text-sub hover:border-ink hover:text-ink"
              )}
            >
              {op.etiqueta}
            </button>
          ))}
        </div>
        {tipoHoja !== "auto" && (
          <p className="mt-2 text-[11px] text-faint">
            Se ignora la columna Tipo si la hay: todo se importa como{" "}
            {tipoHoja === "ingreso" ? "ingresos" : "gastos"}.
          </p>
        )}
      </div>

      <div className="grid gap-x-4 gap-y-2.5 px-4 py-4 sm:grid-cols-2">
        {CAMPOS_MAPEO.filter(
          (campo) => tipoHoja === "auto" || campo !== "tipo"
        ).map((campo) => (
          <FilaMapeo key={campo} campo={campo} mapeo={mapeo} onChange={onChange} />
        ))}
      </div>
      <p className="px-4 pb-1 text-[11px] text-faint">
        Fecha y Monto son obligatorias. Si el archivo separa ingresos y
        egresos en dos columnas (ej: “Dinero enviado” / “Dinero recibido”),
        usá <span className="font-medium text-sub">Monto (ingresos)</span> y{" "}
        <span className="font-medium text-sub">Monto (egresos)</span> en vez
        de Monto.
      </p>

      <div className="border-t border-line px-4 py-3">
        {!completa ? (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            <svg
              viewBox="0 0 24 24"
              className="mt-0.5 size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M12 8v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              Faltan columnas obligatorias:{" "}
              <span className="font-semibold">
                {faltan
                  .map((f) =>
                    f === "monto"
                      ? "Monto (o Monto de ingresos/egresos)"
                      : ETIQUETA_MAPEO[f]
                  )
                  .join(" y ")}
              </span>
              . Esta hoja no se va a importar.
            </span>
          </div>
        ) : (
          <>
            {resultado.datos.length > 0 && (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-faint">
                      <th className="py-1 pr-3 font-medium">Fecha</th>
                      <th className="py-1 pr-3 font-medium">Tipo</th>
                      <th className="py-1 pr-3 font-medium">Monto</th>
                      <th className="py-1 pr-3 font-medium">Moneda</th>
                      <th className="py-1 pr-3 font-medium">Categoría</th>
                      <th className="py-1 font-medium">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.datos.slice(0, 4).map((g, i) => (
                      <tr key={i} className="border-t border-line/60">
                        <td className="whitespace-nowrap py-1.5 pr-3 text-sub">
                          {formatearFechaPreview(g.fecha)}
                        </td>
                        <td
                          className={cn(
                            "whitespace-nowrap py-1.5 pr-3 font-semibold",
                            g.tipo === "ingreso" ? "text-ok" : "text-danger"
                          )}
                        >
                          {g.tipo === "ingreso" ? "+" : "−"}
                        </td>
                        <td className="whitespace-nowrap py-1.5 pr-3 font-semibold text-ink">
                          {formatMonto(g.monto, g.moneda)}
                        </td>
                        <td className="whitespace-nowrap py-1.5 pr-3 text-sub">
                          {g.moneda}
                        </td>
                        <td className="whitespace-nowrap py-1.5 pr-3 text-sub">
                          {g.categoria}
                        </td>
                        <td className="max-w-[160px] truncate py-1.5 text-sub">
                          {g.descripcion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <span className="text-ok">
                {resultado.datos.length} movimiento
                {resultado.datos.length !== 1 ? "s" : ""} listo
                {resultado.datos.length !== 1 ? "s" : ""}
              </span>
              {resultado.errores.length > 0 && (
                <span className="text-danger">
                  {resultado.errores.length} con error
                </span>
              )}
              {resultado.monedasAsumidas > 0 && (
                <span className="text-sub">
                  {resultado.monedasAsumidas} sin moneda → ARS
                </span>
              )}
            </div>
            {resultado.errores.length > 0 && (
              <div className="mt-2 space-y-1">
                {resultado.errores.slice(0, 3).map((e) => (
                  <p
                    key={`${e.fila}-${e.mensaje}`}
                    className="rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-[11px] text-danger"
                  >
                    Fila {e.fila}: {e.mensaje}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilaMapeo({
  campo,
  mapeo,
  onChange,
}: {
  campo: CampoMapeo;
  mapeo: MapeoHoja;
  onChange: (mapeo: MapeoHoja) => void;
}) {
  const { hoja, asignacion } = mapeo;
  const columnaIdx = asignacion[campo];
  const usadas = new Set(
    (Object.keys(asignacion) as CampoMapeo[])
      .filter((c) => c !== campo)
      .map((c) => asignacion[c] as number)
  );
  const columna =
    columnaIdx !== undefined
      ? hoja.columnas.find((c) => c.indice === columnaIdx)
      : undefined;
  const obligatorio =
    campo === "fecha" ||
    (campo === "monto" && asignacion.montoEntrada === undefined && asignacion.montoSalida === undefined);

  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-faint">
        {ETIQUETA_MAPEO[campo]}
        {obligatorio && <span className="text-danger">*</span>}
      </span>
      <span className="relative block">
        <select
          value={columnaIdx ?? ""}
          onChange={(e) => {
            const valor = e.target.value;
            const nueva = { ...asignacion };
            if (valor === "") {
              delete nueva[campo];
            } else {
              const idx = Number(valor);
              (Object.keys(nueva) as CampoMapeo[]).forEach((c) => {
                if (c !== campo && nueva[c] === idx) delete nueva[c];
              });
              nueva[campo] = idx;
            }
            onChange({ ...mapeo, asignacion: nueva });
          }}
          className={cn(
            "w-full cursor-pointer appearance-none rounded-xl border bg-surface-2 px-3 py-2 pr-9 text-sm text-ink outline-none transition-colors focus:border-ink",
            columnaIdx === undefined
              ? "border-dashed border-line"
              : "border-line"
          )}
        >
          <option value="">— Sin usar —</option>
          {hoja.columnas.map((c) => {
            const nombre = c.nombre || `Columna ${c.indice + 1}`;
            const usada = usadas.has(c.indice);
            return (
              <option key={c.indice} value={c.indice} disabled={usada}>
                {nombre}
                {usada ? " · usada" : ""}
              </option>
            );
          })}
        </select>
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-faint"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {columna && columna.ejemplos.length > 0 && (
        <span className="mt-1 block truncate text-[11px] text-faint">
          ej: {columna.ejemplos.join(" · ")}
        </span>
      )}
    </label>
  );
}
