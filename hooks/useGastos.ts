"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Gasto, Recurrencia } from "@/lib/types";

export type DatosMovimiento = {
  monto: number;
  moneda: "ARS" | "USD";
  tipo: "gasto" | "ingreso";
  categoria: string;
  descripcion: string;
  fecha: string;
  recurrencia?: Recurrencia | null;
  tags?: string[];
  comentario?: string;
};

export function useGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cargadoRef = useRef(false);

  const refrescar = useCallback(async () => {
    try {
      const res = await fetch("/api/gastos", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron cargar los gastos");
      const data = (await res.json()) as { gastos: Gasto[] };
      setGastos(data.gastos ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (cargadoRef.current) return;
    cargadoRef.current = true;
    refrescar();
  }, [refrescar]);

  const agregar = useCallback(
    (gasto: Gasto) => {
      setGastos((prev) => [gasto, ...prev]);
    },
    []
  );

  const crear = useCallback(
    async (datos: DatosMovimiento): Promise<Gasto> => {
      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "No se pudo guardar el gasto");
      }
      const data = (await res.json()) as { gasto: Gasto };
      setGastos((prev) => [
        data.gasto,
        ...prev.filter((g) => g.id !== data.gasto.id),
      ]);
      return data.gasto;
    },
    []
  );

  const actualizar = useCallback(
    async (id: string, datos: DatosMovimiento): Promise<Gasto> => {
      const res = await fetch(`/api/gastos?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "No se pudo actualizar el gasto");
      }
      const data = (await res.json()) as { gasto: Gasto };
      setGastos((prev) => prev.map((g) => (g.id === id ? data.gasto : g)));
      return data.gasto;
    },
    []
  );

  const eliminar = useCallback(async (id: string) => {
    setGastos((prev) => prev.filter((g) => g.id !== id));
    await fetch(`/api/gastos?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }, []);

  return {
    gastos,
    cargando,
    error,
    refrescar,
    crear,
    actualizar,
    eliminar,
    agregar,
  };
}
