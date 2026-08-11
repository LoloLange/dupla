"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  esMonedaSecundaria,
  type MonedaSecundaria,
} from "@/lib/types";

type PreferenciasContextValue = {
  monedaSecundaria: MonedaSecundaria | null;
  verDetalleMonedas: boolean;
  verBalance: boolean;
  cargando: boolean;
  setMonedaSecundaria: (moneda: MonedaSecundaria | null) => void;
  setVerDetalleMonedas: (valor: boolean) => void;
  setVerBalance: (valor: boolean) => void;
};

const PreferenciasContext = createContext<PreferenciasContextValue | null>(
  null
);

export function PreferenciasProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [monedaSecundaria, setMonedaSecundariaState] = useState<
    MonedaSecundaria | null
  >(null);
  const [verDetalleMonedas, setVerDetalleMonedasState] = useState(true);
  const [verBalance, setVerBalanceState] = useState(true);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!activo || !data.user) {
        if (activo) setCargando(false);
        return;
      }
      try {
        const res = await supabase
          .from("perfiles")
          .select("moneda_secundaria, ver_detalle_monedas, ver_balance")
          .eq("user_id", data.user.id)
          .maybeSingle();
        const valor = res.data?.moneda_secundaria ?? "USD";
        if (activo) {
          setMonedaSecundariaState(
            esMonedaSecundaria(valor) ? valor : "USD"
          );
          setVerDetalleMonedasState(
            res.data?.ver_detalle_monedas ?? true
          );
          setVerBalanceState(res.data?.ver_balance ?? true);
        }
      } catch {
        if (activo) {
          setMonedaSecundariaState("USD");
          setVerDetalleMonedasState(true);
          setVerBalanceState(true);
        }
      } finally {
        if (activo) setCargando(false);
      }
    });

    return () => {
      activo = false;
    };
  }, []);

  const persistir = useCallback((campos: Record<string, unknown>) => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("perfiles")
        .upsert({
          user_id: data.user.id,
          ...campos,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error)
            console.error("Error guardando preferencias", error);
        });
    });
  }, []);

  const setMonedaSecundaria = useCallback(
    (moneda: MonedaSecundaria | null) => {
      setMonedaSecundariaState(moneda);
      persistir({ moneda_secundaria: moneda });
    },
    [persistir]
  );

  const setVerDetalleMonedas = useCallback(
    (valor: boolean) => {
      setVerDetalleMonedasState(valor);
      persistir({ ver_detalle_monedas: valor });
    },
    [persistir]
  );

  const setVerBalance = useCallback(
    (valor: boolean) => {
      setVerBalanceState(valor);
      persistir({ ver_balance: valor });
    },
    [persistir]
  );

  const value = useMemo<PreferenciasContextValue>(
    () => ({
      monedaSecundaria,
      verDetalleMonedas,
      verBalance,
      cargando,
      setMonedaSecundaria,
      setVerDetalleMonedas,
      setVerBalance,
    }),
    [
      monedaSecundaria,
      verDetalleMonedas,
      verBalance,
      cargando,
      setMonedaSecundaria,
      setVerDetalleMonedas,
      setVerBalance,
    ]
  );

  return (
    <PreferenciasContext.Provider value={value}>
      {children}
    </PreferenciasContext.Provider>
  );
}

export function usePreferencias(): PreferenciasContextValue {
  const ctx = useContext(PreferenciasContext);
  if (!ctx) throw new Error("usePreferencias debe usarse dentro de <PreferenciasProvider>");
  return ctx;
}
