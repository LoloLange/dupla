"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  TEMA_DEFECTO,
  validarTema,
  temaPorSlug,
  type TemaInfo,
  type VarianteTema,
} from "@/lib/temas-data";

const CLAVE_LOCAL = "dupla-tema";
const CLAVE_LEGACY = "dupla-theme";
const TEMA_AUTH = "dupla-clasico-light";

type ThemeContextValue = {
  tema: string;
  variante: VarianteTema;
  temaInfo: TemaInfo | null;
  setTema: (tema: string) => void;
  alternarVariante: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function leerLocal(): string | null {
  try {
    return localStorage.getItem(CLAVE_LOCAL);
  } catch {
    return null;
  }
}

function migrarLocal(): string | null {
  try {
    const legacy = localStorage.getItem(CLAVE_LEGACY);
    if (legacy === "light" || legacy === "dark") {
      const slug = TEMA_DEFECTO.split("-").slice(0, -1).join("-");
      return `${slug}-${legacy}`;
    }
    return null;
  } catch {
    return null;
  }
}

function leerInicial(): string {
  return validarTema(leerLocal() ?? migrarLocal());
}

function aplicarEnDocumento(tema: string) {
  const variante: VarianteTema = tema.endsWith("-dark") ? "dark" : "light";
  const root = document.documentElement;
  root.setAttribute("data-theme", tema);
  root.classList.toggle("dark", variante === "dark");
  root.classList.toggle("light", variante === "light");
}

function cargarFuente(fuente: string | null) {
  const viejo = document.getElementById("dupla-fuente");
  if (viejo) viejo.remove();
  if (!fuente) return;
  const nombre = fuente.trim().replace(/\s+/g, "+");
  const link = document.createElement("link");
  link.id = "dupla-fuente";
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${nombre}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { usuario, perfil, actualizar } = useAuth();
  const pathname = usePathname();
  const esPaginaAuth = pathname === "/login" || pathname.startsWith("/login/");

  const [tema, setTemaState] = useState<string>(leerInicial);

  const setTema = useCallback((temaValor: string) => {
    setTemaState(validarTema(temaValor));
  }, []);

  const temaEfectivo = esPaginaAuth ? TEMA_AUTH : tema;

  // Servidor: si no hay tema local, adoptar el tema guardado en el perfil
  const temaServidor = perfil?.tema;
  useEffect(() => {
    if (esPaginaAuth || !temaServidor) return;
    if (!leerLocal() && temaServidor !== tema) {
      void Promise.resolve().then(() => setTema(temaServidor));
    }
  }, [esPaginaAuth, temaServidor, tema, setTema]);

  // Aplicar el tema al documento y persistirlo localmente
  useEffect(() => {
    aplicarEnDocumento(temaEfectivo);
    if (!esPaginaAuth) {
      try {
        localStorage.setItem(CLAVE_LOCAL, temaEfectivo);
        localStorage.removeItem(CLAVE_LEGACY);
      } catch {
        /* almacenamiento no disponible */
      }
    }
  }, [temaEfectivo, esPaginaAuth]);

  // Sync al servidor cuando cambia el tema (no en páginas de auth)
  useEffect(() => {
    if (esPaginaAuth || !usuario) return;
    if (tema === perfil?.tema) return;
    actualizar({ tema }).catch(() => {
      /* reintento en el próximo cambio */
    });
  }, [tema, esPaginaAuth, usuario, perfil?.tema, actualizar]);

  // Cargar la fuente del tema activo
  useEffect(() => {
    const slug = temaEfectivo.split("-").slice(0, -1).join("-");
    const info = temaPorSlug(slug);
    cargarFuente(info?.fuente ?? null);
  }, [temaEfectivo]);

  const value = useMemo<ThemeContextValue>(() => {
    const variante: VarianteTema = temaEfectivo.endsWith("-dark")
      ? "dark"
      : "light";
    const temaInfo = temaPorSlug(temaEfectivo.split("-").slice(0, -1).join("-"));
    return {
      tema: temaEfectivo,
      variante,
      temaInfo,
      setTema,
      alternarVariante: () => {
        if (esPaginaAuth) return;
        setTema(
          `${temaEfectivo.split("-").slice(0, -1).join("-")}-${
            variante === "dark" ? "light" : "dark"
          }`
        );
      },
    };
  }, [temaEfectivo, setTema, esPaginaAuth]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}

export function ThemeToggle() {
  const { variante, alternarVariante } = useTheme();

  return (
    <button
      type="button"
      aria-label="Cambiar entre modo claro y oscuro"
      onClick={alternarVariante}
      className="grid size-10 cursor-pointer place-items-center rounded-full border border-line bg-surface text-sub shadow-sm transition-all hover:-translate-y-0.5 hover:text-ink active:scale-95"
    >
      {variante === "dark" ? (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
