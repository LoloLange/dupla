"use client";

import { useState } from "react";
import { FiltroFecha } from "@/components/dashboard/FiltroFecha";
import { FiltroCategoria } from "@/components/dashboard/FiltroCategoria";
import { FiltroMoneda } from "@/components/dashboard/FiltroMoneda";
import { cn, type RangoFecha } from "@/lib/utils";
import type { Moneda } from "@/lib/types";

export type Orden = "desc" | "asc";

export function FiltrosYOrden({
  rango,
  onChangeRango,
  categorias,
  onChangeCategorias,
  monedas,
  onChangeMonedas,
  busqueda,
  onChangeBusqueda,
  orden,
  onChangeOrden,
}: {
  rango: RangoFecha;
  onChangeRango: (rango: RangoFecha) => void;
  categorias: string[];
  onChangeCategorias: (categorias: string[]) => void;
  monedas: Moneda[];
  onChangeMonedas: (monedas: Moneda[]) => void;
  busqueda: string;
  onChangeBusqueda: (busqueda: string) => void;
  orden: Orden;
  onChangeOrden: (orden: Orden) => void;
}) {
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink transition-colors focus-within:border-ars sm:max-w-xs">
          <svg
            viewBox="0 0 24 24"
            className="size-4 shrink-0 text-sub"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
            />
          </svg>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => onChangeBusqueda(e.target.value)}
            placeholder="Buscar"
            aria-label="Buscar gastos por nombre"
            className="w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-sub focus:outline-none"
          />
        </label>

        <button
          type="button"
          onClick={() => setFiltrosAbiertos((v) => !v)}
          aria-expanded={filtrosAbiertos}
          aria-controls="panel-filtros"
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-[0.97]",
            filtrosAbiertos
              ? "border-ars bg-ars text-white shadow-sm"
              : "border-line bg-surface text-sub hover:border-ink hover:text-ink"
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v2.7M12 18.3V21m-6.36-4.5 1.91-1.91M16.45 9.41l1.91-1.91M5.64 7.5l1.91 1.91M16.45 14.59l1.91 1.91M3 12h2.7M18.3 12H21M8.25 12a3.75 3.75 0 1 0 7.5 0 3.75 3.75 0 0 0-7.5 0Z"
            />
          </svg>
          Filtrar
        </button>

        <button
          type="button"
          onClick={() => onChangeOrden(orden === "desc" ? "asc" : "desc")}
          aria-label={
            orden === "desc"
              ? "Ordenar de más antiguos a más recientes"
              : "Ordenar de más recientes a más antiguos"
          }
          title={
            orden === "desc"
              ? "Más recientes primero"
              : "Más antiguos primero"
          }
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-sub transition-all hover:border-ink hover:text-ink active:scale-[0.97]"
        >
          <svg
            viewBox="0 0 24 24"
            className={cn("size-4", orden === "asc" && "rotate-180")}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3"
            />
          </svg>
          {orden === "desc" ? "Recientes" : "Antiguos"}
        </button>
      </div>

      {filtrosAbiertos && (
        <div
          id="panel-filtros"
          className="anim-fade-in mt-3 flex flex-col gap-3"
        >
          <FiltroFecha rango={rango} onChange={onChangeRango} />
          <FiltroCategoria
            seleccionadas={categorias}
            onChange={onChangeCategorias}
          />
          <FiltroMoneda seleccionadas={monedas} onChange={onChangeMonedas} />
        </div>
      )}
    </div>
  );
}
