"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/components/AuthProvider";
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
  const { perfil, cargando: cargandoAuth, actualizar } = useAuth();
  const [monedaSecundaria, setMonedaSecundariaState] = useState<
    MonedaSecundaria | null
  >(null);
  const [verDetalleMonedas, setVerDetalleMonedasState] = useState(true);
  const [verBalance, setVerBalanceState] = useState(true);

  useEffect(() => {
    if (!perfil) return;
    const valor = perfil.moneda_secundaria ?? "USD";
    void Promise.resolve().then(() => {
      setMonedaSecundariaState(esMonedaSecundaria(valor) ? valor : "USD");
      setVerDetalleMonedasState(perfil.ver_detalle_monedas ?? true);
      setVerBalanceState(perfil.ver_balance ?? true);
    });
  }, [perfil]);

  const persistir = useCallback(
    (campos: {
      moneda_secundaria?: string | null;
      ver_detalle_monedas?: boolean;
      ver_balance?: boolean;
    }) => {
      actualizar(campos).catch(() => {
        /* reintento en el próximo cambio */
      });
    },
    [actualizar]
  );

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
      cargando: cargandoAuth,
      setMonedaSecundaria,
      setVerDetalleMonedas,
      setVerBalance,
    }),
    [
      monedaSecundaria,
      verDetalleMonedas,
      verBalance,
      cargandoAuth,
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
