"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Gasto, Moneda, Recurrencia } from "@/lib/types";

const PASO = 100;

export type DatosMovimiento = {
  monto: number;
  moneda: Moneda;
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
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tieneMas, setTieneMas] = useState(false);
  const gastosRef = useRef<Gasto[]>([]);
  const totalRef = useRef(0);
  const cargandoMasRef = useRef(false);
  const cargadoRef = useRef(false);

  const fijarGastos = useCallback((lista: Gasto[], total: number) => {
    gastosRef.current = lista;
    totalRef.current = total;
    setGastos(lista);
    setTieneMas(total > lista.length);
  }, []);

  const refrescar = useCallback(async () => {
    try {
      const res = await fetch("/api/gastos", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron cargar los gastos");
      const data = (await res.json()) as { gastos: Gasto[]; total?: number };
      const lista = data.gastos ?? [];
      fijarGastos(lista, data.total ?? lista.length);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setCargando(false);
    }
  }, [fijarGastos]);

  useEffect(() => {
    if (cargadoRef.current) return;
    cargadoRef.current = true;
    refrescar();
  }, [refrescar]);

  const cargarMas = useCallback(async () => {
    if (cargandoMasRef.current) return;
    cargandoMasRef.current = true;
    setCargandoMas(true);
    try {
      const offset = gastosRef.current.length;
      const res = await fetch(`/api/gastos?limite=${PASO}&offset=${offset}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("No se pudieron cargar más movimientos");
      const data = (await res.json()) as { gastos: Gasto[]; total?: number };
      const vistos = new Set(gastosRef.current.map((g) => g.id));
      const anexo = (data.gastos ?? []).filter((g) => !vistos.has(g.id));
      const siguiente = [...gastosRef.current, ...anexo];
      fijarGastos(siguiente, data.total ?? siguiente.length);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      cargandoMasRef.current = false;
      setCargandoMas(false);
    }
  }, [fijarGastos]);

  const agregar = useCallback(
    (gasto: Gasto) => {
      const siguiente = [
        gasto,
        ...gastosRef.current.filter((g) => g.id !== gasto.id),
      ];
      fijarGastos(siguiente, totalRef.current + 1);
    },
    [fijarGastos]
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
      const siguiente = [
        data.gasto,
        ...gastosRef.current.filter((g) => g.id !== data.gasto.id),
      ];
      fijarGastos(siguiente, totalRef.current + 1);
      return data.gasto;
    },
    [fijarGastos]
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
      fijarGastos(
        gastosRef.current.map((g) => (g.id === id ? data.gasto : g)),
        totalRef.current
      );
      return data.gasto;
    },
    [fijarGastos]
  );

  const eliminar = useCallback(
    async (id: string) => {
      fijarGastos(
        gastosRef.current.filter((g) => g.id !== id),
        Math.max(0, totalRef.current - 1)
      );
      await fetch(`/api/gastos?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
    [fijarGastos]
  );

  return {
    gastos,
    cargando,
    cargandoMas,
    error,
    tieneMas,
    refrescar,
    cargarMas,
    crear,
    actualizar,
    eliminar,
    agregar,
  };
}
