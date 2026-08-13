"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { bloquearScrollPagina } from "@/lib/scroll";

const BOX = 256;
const SALIDA = 256;
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

type Desplazamiento = { x: number; y: number };

export function RecorteFoto({
  archivo,
  onCancelar,
  onAplicar,
}: {
  archivo: File;
  onCancelar: () => void;
  onAplicar: (dataUrl: string) => Promise<void>;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Desplazamiento>({ x: 0, y: 0 });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const zoomRef = useRef(1);
  const offsetRef = useRef<Desplazamiento>({ x: 0, y: 0 });
  const arrastreRef = useRef<{
    px: number;
    py: number;
    ox: number;
    oy: number;
  } | null>(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const coverScale = img
    ? Math.max(BOX / img.naturalWidth, BOX / img.naturalHeight)
    : 1;
  const escalaActual = coverScale * zoom;
  const displayW = img ? img.naturalWidth * escalaActual : BOX;
  const displayH = img ? img.naturalHeight * escalaActual : BOX;

  useEffect(() => {
    if (!archivo) return;
    const url = URL.createObjectURL(archivo);
    urlRef.current = url;
    let activo = true;
    const imagen = new Image();
    imagen.onload = () => {
      if (!activo) return;
      imgRef.current = imagen;
      setImg(imagen);
      setUrl(url);
      const escalaInicial = Math.max(
        BOX / imagen.naturalWidth,
        BOX / imagen.naturalHeight
      );
      setZoom(1);
      setOffset({
        x: (BOX - imagen.naturalWidth * escalaInicial) / 2,
        y: (BOX - imagen.naturalHeight * escalaInicial) / 2,
      });
    };
    imagen.onerror = () => {
      if (activo) setError("No se pudo leer la imagen. Probá con otra.");
    };
    imagen.src = url;
    return () => {
      activo = false;
      URL.revokeObjectURL(url);
      urlRef.current = null;
    };
  }, [archivo]);

  useEffect(() => {
    const desbloquear = bloquearScrollPagina();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !guardando) onCancelar();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      desbloquear();
      window.removeEventListener("keydown", onKey);
    };
  }, [guardando, onCancelar]);

  const acotar = useCallback(
    (x: number, y: number, w: number, h: number): Desplazamiento => ({
      x: Math.min(0, Math.max(BOX - w, x)),
      y: Math.min(0, Math.max(BOX - h, y)),
    }),
    []
  );

  const aplicarZoom = useCallback(
    (nuevoZoom: number) => {
      const e0 = coverScale * zoomRef.current;
      const e1 = coverScale * nuevoZoom;
      const o = offsetRef.current;
      const cx = (BOX / 2 - o.x) / e0;
      const cy = (BOX / 2 - o.y) / e0;
      const w = imgRef.current ? imgRef.current.naturalWidth * e1 : BOX;
      const h = imgRef.current ? imgRef.current.naturalHeight * e1 : BOX;
      setZoom(nuevoZoom);
      setOffset(acotar(BOX / 2 - cx * e1, BOX / 2 - cy * e1, w, h));
    },
    [coverScale, acotar]
  );

  const aplicar = useCallback(async () => {
    if (!img) return;
    setGuardando(true);
    setError(null);
    try {
      const escala = coverScale * zoomRef.current;
      const sw = BOX / escala;
      const sx = -offsetRef.current.x / escala;
      const sy = -offsetRef.current.y / escala;
      const canvas = document.createElement("canvas");
      canvas.width = SALIDA;
      canvas.height = SALIDA;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Sin canvas");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sw, 0, 0, SALIDA, SALIDA);
      await onAplicar(canvas.toDataURL("image/jpeg", 0.85));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la foto");
      setGuardando(false);
    }
  }, [img, coverScale, onAplicar]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-5 backdrop-blur-sm anim-fade-in [touch-action:none]"
      role="dialog"
      aria-modal="true"
      aria-label="Ajustar foto de perfil"
    >
      <div className="anim-pop-in w-full max-w-sm rounded-3xl border border-line bg-surface p-5 shadow-2xl">
        <h3 className="font-display text-xl font-medium tracking-tight text-ink">
          Ajustá tu foto
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-sub">
          Arrastrá para encuadrar y usá el zoom. Se muestra como un círculo.
        </p>

        <div
          onPointerDown={(e) => {
            if (guardando) return;
            arrastreRef.current = {
              px: e.clientX,
              py: e.clientY,
              ox: offsetRef.current.x,
              oy: offsetRef.current.y,
            };
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              /* noop */
            }
          }}
          onPointerMove={(e) => {
            const d = arrastreRef.current;
            if (!d) return;
            setOffset(
              acotar(
                d.ox + e.clientX - d.px,
                d.oy + e.clientY - d.py,
                displayW,
                displayH
              )
            );
          }}
          onPointerUp={() => {
            arrastreRef.current = null;
          }}
          onPointerCancel={() => {
            arrastreRef.current = null;
          }}
          className="relative mx-auto mt-4 size-64 cursor-grab touch-none select-none overflow-hidden rounded-full border border-line shadow-2xl active:cursor-grabbing"
        >
          {img && (
            // eslint-disable-next-line @next/next/no-img-element -- blob local en preview del recorte
            <img
              src={url ?? undefined}
              alt="Vista previa de la foto de perfil"
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none"
              style={{
                width: displayW,
                height: displayH,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),inset_0_0_60px_rgba(0,0,0,0.45)]"
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <svg
            viewBox="0 0 24 24"
            className="size-4 shrink-0 text-sub"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18Zm0 0l2.5 2.5M12 3L9.5 5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.01}
            value={zoom}
            onChange={(e) => aplicarZoom(Number(e.target.value))}
            disabled={guardando}
            aria-label="Zoom de la foto"
            className="w-full cursor-pointer accent-[var(--ars)]"
          />
          <svg
            viewBox="0 0 24 24"
            className="size-4 shrink-0 text-sub"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Zm0 0l2.5-2.5M12 21l-2.5-2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {error && (
          <p className="anim-fade-in mt-3 rounded-xl bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => void aplicar()}
            disabled={guardando || !img}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-ars py-3 font-semibold text-white shadow-lg transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-default disabled:opacity-50"
          >
            {guardando && (
              <span
                className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                style={{ animation: "spin-soft 0.8s linear infinite" }}
              />
            )}
            {guardando ? "Guardando…" : "Aplicar"}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            className="cursor-pointer rounded-2xl border border-line py-3 font-medium text-sub transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-default disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
