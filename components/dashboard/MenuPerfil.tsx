"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { RecorteFoto } from "@/components/dashboard/RecorteFoto";

export function MenuPerfil() {
  const router = useRouter();
  const { usuario, actualizar } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreBorrador, setNombreBorrador] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recorteFoto, setRecorteFoto] = useState<File | null>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const nombre = usuario?.nombre?.trim() || usuario?.email?.split("@")[0] || "Dupla";
  const inicial = (usuario?.nombre || usuario?.email || "D").charAt(0).toUpperCase();

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: PointerEvent) => {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("pointerdown", cerrar);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", cerrar);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const guardarNombre = useCallback(async () => {
    const nuevo = nombreBorrador.trim();
    if (nuevo.length < 2 || nuevo.length > 60) {
      setError("El nombre debe tener entre 2 y 60 caracteres");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await actualizar({ nombre: nuevo });
      setEditandoNombre(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }, [nombreBorrador, actualizar]);

  const cambiarFoto = useCallback(
    (archivo: File) => {
      if (archivo.size > 5 * 1024 * 1024) {
        setError("La foto es demasiado grande (máx. 5 MB)");
        return;
      }
      setError(null);
      setRecorteFoto(archivo);
    },
    []
  );

  const aplicarRecorte = useCallback(
    async (dataUrl: string) => {
      setGuardando(true);
      try {
        await actualizar({ foto_url: dataUrl });
        setRecorteFoto(null);
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : "No se pudo guardar");
      } finally {
        setGuardando(false);
      }
    },
    [actualizar]
  );

  const cerrarSesion = useCallback(async () => {
    setAbierto(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  return (
    <div ref={cajaRef} className="relative">
      <button
        type="button"
        aria-label="Menú de perfil"
        onClick={() => setAbierto((v) => !v)}
        className="grid size-10 cursor-pointer place-items-center overflow-hidden rounded-full border border-line bg-surface font-display text-base font-semibold text-ars shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
      >
        {usuario?.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={usuario.foto_url}
            alt="Foto de perfil"
            className="size-full object-cover"
          />
        ) : (
          inicial
        )}
      </button>

      {abierto && (
        <div className="anim-fade-in absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl">
          <div className="flex items-center gap-3 border-b border-line/60 px-5 py-4">
            <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-bg font-display text-lg font-semibold text-ars">
              {usuario?.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={usuario.foto_url}
                  alt="Foto de perfil"
                  className="size-full object-cover"
                />
              ) : (
                inicial
              )}
            </div>
            <div className="min-w-0 flex-1">
              {editandoNombre ? (
                <div className="flex items-center gap-1.5">
                  <input
                    value={nombreBorrador}
                    onChange={(e) => setNombreBorrador(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void guardarNombre();
                      if (e.key === "Escape") setEditandoNombre(false);
                    }}
                    autoFocus
                    maxLength={60}
                    className="w-full min-w-0 rounded-lg border border-line bg-bg px-2 py-1 text-sm text-ink outline-none focus:border-ars"
                  />
                  <button
                    type="button"
                    onClick={() => void guardarNombre()}
                    disabled={guardando}
                    className="shrink-0 cursor-pointer rounded-lg bg-ars px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNombreBorrador(nombre);
                    setEditandoNombre(true);
                  }}
                  className="block max-w-full cursor-pointer truncate text-left font-display text-base font-semibold text-ink transition-colors hover:text-ars"
                  title="Editar nombre"
                >
                  {nombre}
                </button>
              )}
              <p className="truncate text-xs text-sub">{usuario?.email}</p>
            </div>
          </div>

          <div className="space-y-1 px-2 py-2">
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={guardando}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bg disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="size-4 text-sub" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0 0 21.75 19.5V4.5A1.5 1.5 0 0 0 20.25 3H3.75A1.5 1.5 0 0 0 2.25 4.5v15A1.5 1.5 0 0 0 3.75 21Zm3-13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
              </svg>
              Cambiar foto
            </button>
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) cambiarFoto(archivo);
                e.target.value = "";
              }}
            />
            <Link
              href="/ajustes"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bg"
            >
              <svg viewBox="0 0 24 24" className="size-4 text-sub" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
              Ajustes
            </Link>
            <button
              type="button"
              onClick={() => void cerrarSesion()}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Cerrar sesión
            </button>
          </div>

          {error && (
            <p className="border-t border-line/60 px-5 py-3 text-center text-xs font-medium text-danger">
              {error}
            </p>
          )}
        </div>
      )}

      {recorteFoto && (
        <RecorteFoto
          archivo={recorteFoto}
          onCancelar={() => setRecorteFoto(null)}
          onAplicar={aplicarRecorte}
        />
      )}
    </div>
  );
}
