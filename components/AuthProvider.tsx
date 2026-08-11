"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type UsuarioAuth = {
  id: string;
  email: string;
  google_sub: string | null;
  nombre: string | null;
  foto_url: string | null;
};

export type PerfilAuth = {
  user_id: string;
  tema: string | null;
  moneda_secundaria: string | null;
  ver_detalle_monedas: boolean | null;
  ver_balance: boolean | null;
};

type CamposPerfil = {
  nombre?: string;
  foto_url?: string;
  tema?: string;
  moneda_secundaria?: string | null;
  ver_detalle_monedas?: boolean;
  ver_balance?: boolean;
};

type AuthContextValue = {
  usuario: UsuarioAuth | null;
  perfil: PerfilAuth | null;
  cargando: boolean;
  actualizar: (campos: CamposPerfil) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [perfil, setPerfil] = useState<PerfilAuth | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    fetch("/api/auth/usuario")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!activo || !data?.usuario) return;
        setUsuario(data.usuario);
        setPerfil(data.perfil ?? null);
      })
      .catch(() => {
        /* sin sesión o sin red */
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const actualizar = useCallback(async (campos: CamposPerfil) => {
    const res = await fetch("/api/auth/usuario", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campos),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "No se pudo guardar");
    }
    const data = await res.json();
    setUsuario(data.usuario);
    setPerfil(data.perfil ?? null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, perfil, cargando, actualizar }),
    [usuario, perfil, cargando, actualizar]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
