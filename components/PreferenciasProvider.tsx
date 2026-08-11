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
  cargando: boolean;
  setMonedaSecundaria: (moneda: MonedaSecundaria | null) => void;
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
          .select("moneda_secundaria")
          .eq("user_id", data.user.id)
          .maybeSingle();
        const valor = res.data?.moneda_secundaria ?? "USD";
        if (activo) {
          setMonedaSecundariaState(
            esMonedaSecundaria(valor) ? valor : "USD"
          );
        }
      } catch {
        if (activo) setMonedaSecundariaState("USD");
      } finally {
        if (activo) setCargando(false);
      }
    });

    return () => {
      activo = false;
    };
  }, []);

  const setMonedaSecundaria = useCallback(
    (moneda: MonedaSecundaria | null) => {
      setMonedaSecundariaState(moneda);
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) return;
        const fila =
          moneda === null
            ? { user_id: data.user.id, moneda_secundaria: null }
            : { user_id: data.user.id, moneda_secundaria: moneda };
        supabase
          .from("perfiles")
          .upsert({ ...fila, updated_at: new Date().toISOString() })
          .then(({ error }) => {
            if (error)
              console.error("Error guardando moneda secundaria", error);
          });
      });
    },
    []
  );

  const value = useMemo<PreferenciasContextValue>(
    () => ({ monedaSecundaria, cargando, setMonedaSecundaria }),
    [monedaSecundaria, cargando, setMonedaSecundaria]
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
