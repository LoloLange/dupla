"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TEMA_DEFECTO,
  validarTema,
  temaPorSlug,
  type TemaInfo,
  type VarianteTema,
} from "@/lib/temas-data";

const CLAVE_LOCAL = "dupla-tema";
const CLAVE_LEGACY = "dupla-theme";

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
  const [tema, setTemaState] = useState<string>(leerInicial);
  const userIdRef = useRef<string | null>(null);

  const setTema = useCallback((temaValor: string) => {
    const validado = validarTema(temaValor);
    aplicarEnDocumento(validado);
    try {
      localStorage.setItem(CLAVE_LOCAL, validado);
    } catch {
      /* almacenamiento no disponible */
    }
    setTemaState(validado);
  }, []);

  // Sincronizar el documento con el tema activo (también en el primer render)
  useEffect(() => {
    aplicarEnDocumento(tema);
    try {
      localStorage.removeItem(CLAVE_LEGACY);
    } catch {
      /* almacenamiento no disponible */
    }
  }, [tema]);

  // Inicialización: tema guardado en Supabase (si localStorage está vacío)
  useEffect(() => {
    let activo = true;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!activo || !data.user) return;
      userIdRef.current = data.user.id;
      let fila: { tema: string } | null = null;
      try {
        const res = await supabase
          .from("perfiles")
          .select("tema")
          .eq("user_id", data.user.id)
          .maybeSingle();
        fila = res.data;
      } catch {
        fila = null;
      }
      if (!activo || !fila?.tema) return;
      // localStorage vacío + tema guardado en el servidor → usar el del servidor
      if (!leerLocal()) setTema(fila.tema);
    });

    return () => {
      activo = false;
    };
  }, [setTema]);

  // Sync a Supabase cuando cambia el tema
  useEffect(() => {
    const userId = userIdRef.current;
    if (!userId) return;
    (async () => {
      const { error } = await createClient()
        .from("perfiles")
        .upsert({ user_id: userId, tema, updated_at: new Date().toISOString() });
      if (error) console.error("Error sincronizando tema", error);
    })();
  }, [tema]);

  // Cargar la fuente del tema activo
  useEffect(() => {
    const info = temaPorSlug(tema.split("-").slice(0, -1).join("-"));
    cargarFuente(info?.fuente ?? null);
  }, [tema]);

  const value = useMemo<ThemeContextValue>(() => {
    const variante: VarianteTema = tema.endsWith("-dark") ? "dark" : "light";
    const temaInfo = temaPorSlug(tema.split("-").slice(0, -1).join("-"));
    return {
      tema,
      variante,
      temaInfo,
      setTema,
      alternarVariante: () =>
        setTema(`${tema.split("-").slice(0, -1).join("-")}-${variante === "dark" ? "light" : "dark"}`),
    };
  }, [tema, setTema]);

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
