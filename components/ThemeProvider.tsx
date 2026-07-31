"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

type Tema = "dark" | "light";

const LISTENERS = new Set<() => void>();
let tema: Tema = "dark";

function getSnapshot(): Tema {
  return tema;
}

function subscribe(listener: () => void): () => void {
  LISTENERS.add(listener);
  return () => LISTENERS.delete(listener);
}

function aplicarTema(nuevo: Tema) {
  tema = nuevo;
  const root = document.documentElement;
  root.classList.toggle("dark", nuevo === "dark");
  root.classList.toggle("light", nuevo === "light");
  localStorage.setItem("dupla-theme", nuevo);
  LISTENERS.forEach((l) => l());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const temaActual = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => "dark"
  );

  const alternar = useCallback(() => {
    aplicarTema(tema === "dark" ? "light" : "dark");
  }, []);

  useEffect(() => {
    const guardado = localStorage.getItem("dupla-theme");
    if (guardado === "light" || guardado === "dark") {
      aplicarTema(guardado);
    }
  }, []);

  return (
    <div className="min-h-dvh">
      {children}
      <button
        type="button"
        aria-label="Cambiar tema"
        onClick={alternar}
        className="fixed bottom-4 right-4 z-50 grid size-11 place-items-center rounded-full border border-line bg-surface text-sub shadow-lg transition-colors hover:text-ink"
      >
        {temaActual === "dark" ? (
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
    </div>
  );
}
