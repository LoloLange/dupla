"use client";

import { cn } from "@/lib/utils";
import type { EstadoVoz } from "@/hooks/useVoiceRecorder";
import { RecordingWaves } from "@/components/voice/RecordingWaves";

type Props = {
  estado: EstadoVoz;
  duracion: number;
  nivel: number;
  onStart: () => void;
  onStop: () => void;
};

export function VoiceButton({ estado, duracion, nivel, onStart, onStop }: Props) {
  const grabando = estado === "recording";
  const procesando = estado === "processing";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex h-44 w-full items-center justify-center">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 m-auto size-64 rounded-full blur-3xl transition-colors duration-700",
            grabando ? "bg-ars-strong/30" : "bg-ars/12"
          )}
        />
        {grabando && (
          <>
            <span className="pulse-ring absolute size-40 rounded-full border-2 border-ars-strong/60" />
            <span
              className="pulse-ring absolute size-40 rounded-full border border-ars-strong/40"
              style={{ animationDelay: "0.45s" }}
            />
          </>
        )}

        <button
          type="button"
          disabled={procesando}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture?.(e.pointerId);
            if (estado === "idle") onStart();
          }}
          onPointerUp={() => {
            onStop();
          }}
          onPointerCancel={() => {
            onStop();
          }}
          style={{ touchAction: "none" }}
          aria-label={
            grabando ? "Soltá para terminar la grabación" : "Grabar un gasto"
          }
          className={cn(
            "group relative grid size-28 select-none place-items-center rounded-full shadow-2xl transition-all duration-300 ease-out sm:size-32 lg:size-36",
            "bg-gradient-to-br from-ars to-ars-strong text-bg",
            "hover:brightness-105 active:scale-95",
            grabando && "scale-105 shadow-ars/30",
            procesando && "cursor-wait opacity-90"
          )}
        >
          {procesando ? (
            <svg
              className="size-10 animate-spin"
              style={{ animation: "spin-soft 1s linear infinite" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M12 3a9 9 0 1 1-8.6 6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="size-11 transition-transform duration-300 group-active:scale-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="2.5" width="6" height="11" rx="3" />
              <path
                d="M5 11a7 7 0 0 0 14 0M12 18v3.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>

        <div
          className={cn(
            "pointer-events-none absolute top-0 transition-all duration-300",
            grabando ? "opacity-100" : "opacity-0 translate-y-2"
          )}
        >
          <RecordingWaves nivel={nivel} activo={grabando} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        {grabando ? (
          <>
            <p className="font-display text-lg tracking-tight text-ink">
              Soltá para terminar
            </p>
            <p className="font-mono text-sm tabular-nums text-ars">
              {String(Math.floor(duracion / 60)).padStart(1, "0")}:
              {String(duracion % 60).padStart(2, "0")}
            </p>
          </>
        ) : procesando ? (
          <p className="font-display text-lg tracking-tight text-ink">
            Dupla te está escuchando…
          </p>
        ) : (
          <>
            <p className="font-display text-lg tracking-tight text-ink">
              Mantené presionado y decí tu gasto
            </p>
            <p className="text-sm text-sub">
              «gasté 8 mil pesos en el super» · «pagué 15 dólares de Netflix»
            </p>
          </>
        )}
      </div>
    </div>
  );
}
