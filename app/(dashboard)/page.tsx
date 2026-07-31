"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useGastos } from "@/hooks/useGastos";
import type { GastoParseado } from "@/lib/types";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { ExpenseConfirmSheet } from "@/components/voice/ExpenseConfirmSheet";
import { Patrimonio } from "@/components/dashboard/Patrimonio";
import { UltimosGastos } from "@/components/dashboard/UltimosGastos";

type Procesando = { activo: boolean; mensaje: string };

export default function DashboardPage() {
  const grabadora = useVoiceRecorder();
  const gastosHook = useGastos();
  const [gastoParseado, setGastoParseado] = useState<GastoParseado | null>(null);
  const [procesando, setProcesando] = useState<Procesando>({ activo: false, mensaje: "" });
  const [aviso, setAviso] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const avisoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarAviso = useCallback((mensaje: string) => {
    setAviso(mensaje);
    if (avisoTimeoutRef.current) clearTimeout(avisoTimeoutRef.current);
    avisoTimeoutRef.current = setTimeout(() => setAviso(null), 4000);
  }, []);

  useEffect(() => {
    let activo = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!activo || !data.user) return;
        const meta = data.user.user_metadata as Record<string, string> | undefined;
        const nombre =
          meta?.full_name ??
          meta?.nombre ??
          data.user.email?.split("@")[0] ??
          null;
        setNombre(nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : null);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  const procesarAudio = useCallback(
    async (blob: Blob) => {
      console.log("[voz] blob enviado:", { type: blob.type, size: blob.size });
      setProcesando({ activo: true, mensaje: "Escuchando…" });
      try {
        const formData = new FormData();
        formData.append("audio", blob);
        const resTrans = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        if (!resTrans.ok) throw new Error("No pudimos escuchar el audio");
        const { texto } = (await resTrans.json()) as { texto: string };

        setProcesando({ activo: true, mensaje: "Interpretando…" });
        const resParse = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto, ahora: new Date().toISOString() }),
        });
        if (resParse.status === 422) {
          const { texto: escuchado } = (await resParse.json()) as {
            texto?: string;
          };
          mostrarAviso(
            escuchado
              ? `No escuché un gasto claro. ¿Dijiste «${escuchado}»?`
              : "No escuché un gasto claro. Probá de nuevo."
          );
          return;
        }
        if (!resParse.ok) throw new Error("No entendimos ese gasto");
        const { gasto } = (await resParse.json()) as { gasto: GastoParseado };

        setGastoParseado(gasto);
      } catch (e) {
        mostrarAviso(
          e instanceof Error ? e.message : "Algo salió mal. Probá de nuevo."
        );
      } finally {
        setProcesando({ activo: false, mensaje: "" });
      }
    },
    [mostrarAviso]
  );

  const confirmarGasto = useCallback(
    async (gasto: GastoParseado) => {
      await gastosHook.crear(gasto);
      mostrarAviso("Gasto guardado");
    },
    [gastosHook, mostrarAviso]
  );

  const eliminarGasto = useCallback(
    (id: string) => {
      gastosHook.eliminar(id);
    },
    [gastosHook]
  );

  const saludo = useCallback(() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 20) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  return (
    <div className="space-y-8 lg:space-y-12">
      <header className="anim-fade-up flex items-center justify-between">
        <div>
          <p className="font-display text-3xl font-semibold tracking-tight text-ink">
            dupla
          </p>
          <p className="text-sm text-sub">tu compañera de gastos</p>
        </div>
        <div className="grid size-10 place-items-center rounded-full border border-line bg-surface font-display text-lg font-semibold text-ars">
          {(nombre ?? "D").charAt(0).toUpperCase()}
        </div>
      </header>

      <div className="anim-fade-up lg:flex lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-sub">
            {saludo()} ·{" "}
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink lg:text-5xl">
            {nombre ? `¡Hola, ${nombre}!` : "¿Qué gastaste hoy?"}
          </h1>
        </div>
        <p className="mt-3 hidden max-w-xs text-sm leading-relaxed text-sub lg:block">
          Mantené presionado el botón y contame con tus palabras. Dupla lo
          anota y lo guarda por vos.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:items-center lg:gap-14">
        <div className="lg:col-span-7">
          <Patrimonio gastos={gastosHook.gastos} />
        </div>

        <div className="lg:col-span-5">
          <VoiceButton
            estado={procesando.activo ? "processing" : grabadora.estado}
            duracion={grabadora.duracion}
            nivel={grabadora.nivel}
            onStart={() => grabadora.empezarGrabacion(procesarAudio)}
            onStop={grabadora.detenerGrabacion}
          />

          {grabadora.error && (
            <p className="anim-fade-in mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-center text-sm text-danger">
              {grabadora.error}
            </p>
          )}
        </div>
      </div>

      <UltimosGastos
        gastos={gastosHook.gastos}
        cargando={gastosHook.cargando}
        onEliminar={eliminarGasto}
      />

      <ExpenseConfirmSheet
        key={
          gastoParseado
            ? `${gastoParseado.monto}-${gastoParseado.moneda}-${gastoParseado.fecha}`
            : "cerrado"
        }
        abierto={!!gastoParseado}
        gasto={gastoParseado}
        onConfirm={confirmarGasto}
        onCancel={() => setGastoParseado(null)}
        onDone={() => setGastoParseado(null)}
      />

      {aviso && (
        <div className="anim-pop-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-ink shadow-2xl">
          {aviso}
        </div>
      )}
    </div>
  );
}
