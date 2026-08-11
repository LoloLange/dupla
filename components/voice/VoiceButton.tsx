"use client";

import { cn } from "@/lib/utils";
import type { EstadoVoz } from "@/hooks/useVoiceRecorder";

type Props = {
  estado: EstadoVoz;
  duracion: number;
  nivel: number;
  mensajeProcesando?: string;
  onStart: () => void;
  onStop: () => void;
};

export function VoiceButton({
  estado,
  duracion,
  mensajeProcesando,
  onStart,
  onStop,
}: Props) {
  const grabando = estado === "recording";
  const procesando = estado === "processing";

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative grid place-items-center">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute size-40 rounded-full blur-3xl transition-all duration-700 lg:size-[14rem]",
            grabando ? "bg-ars-strong/30" : "bg-ars/12",
            !grabando && !procesando && "halo-breath",
          )}
        />
        {grabando ? (
          <>
            <span className="pulse-ring absolute size-24 rounded-full border-2 border-ars-strong/60 lg:size-48" />
            <span
              className="pulse-ring absolute size-24 rounded-full border border-ars-strong/40 lg:size-48"
              style={{ animationDelay: "0.45s" }}
            />
          </>
        ) : !procesando ? (
          <>
            <span className="ping-onda absolute size-24 rounded-full border-2 border-ars-strong/30 lg:size-44" />
            <span
              className="ping-onda absolute size-24 rounded-full border border-ars-strong/20 lg:size-44"
              style={{ animationDelay: "0.9s" }}
            />
          </>
        ) : (
          <>
            <span className="wave absolute size-40 rounded-full border-2 border-ars-strong/50 lg:size-56" />
            <span
              className="wave absolute size-40 rounded-full border border-ars-strong/40 lg:size-56"
              style={{ animationDelay: "0.47s" }}
            />
            <span
              className="wave absolute size-40 rounded-full border border-ars-strong/30 lg:size-56"
              style={{ animationDelay: "0.94s" }}
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
            grabando
              ? "Soltá para terminar la grabación"
              : "Grabar un gasto o ingreso"
          }
          className={cn(
            "group relative grid size-32 cursor-pointer select-none place-items-center rounded-full shadow-2xl transition-all duration-300 ease-out sm:size-36 lg:size-48",
            "bg-gradient-to-br from-ars to-ars-strong text-bg",
            "hover:brightness-105 active:scale-95",
            grabando && "scale-105 shadow-ars/30",
            procesando && "cursor-wait opacity-90",
            !grabando && !procesando && "idle-breath",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-12 transition-transform duration-300 group-active:scale-90 lg:size-14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="2.5" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex h-10 flex-col items-center justify-center text-center">
        {grabando ? (
          <p className="font-display text-base tracking-tight text-ink">
            Soltá para terminar {" "}
            <span className="font-mono text-sm tabular-nums text-ars">
              {String(Math.floor(duracion / 60)).padStart(1, "0")}:
              {String(duracion % 60).padStart(2, "0")}
            </span>
          </p>
        ) : procesando ? (
          <p className="font-display text-base tracking-tight text-ink">
            {mensajeProcesando ?? "Dupla te está escuchando…"}
          </p>
        ) : (
          <>
            <p className="mt-3 max-w-sm font-display text-xs leading-relaxed text-sub lg:mt-8 lg:text-sm">
              Mantené presionado el botón y contame con tus palabras. Dupla lo
              anota y lo guarda por vos.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
