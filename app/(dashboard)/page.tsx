"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useGastos } from "@/hooks/useGastos";
import type { Gasto, GastoParseado } from "@/lib/types";
import { ThemeToggle } from "@/components/ThemeProvider";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { ExpenseConfirmSheet } from "@/components/voice/ExpenseConfirmSheet";
import { Patrimonio } from "@/components/dashboard/Patrimonio";
import { UltimosGastos } from "@/components/dashboard/UltimosGastos";
import { Logo } from "@/components/Logo";

type Procesando = { activo: boolean; mensaje: string };
type ErrorVoz = { mensaje: string; escuchado?: string };
type Aviso = { id: number; texto: string; gastoId?: string };
type Sheet = {
  gasto: (GastoParseado & { id?: string }) | null;
  clave: string;
};

export default function DashboardPage() {
  const grabadora = useVoiceRecorder();
  const gastosHook = useGastos();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [errorVoz, setErrorVoz] = useState<ErrorVoz | null>(null);
  const [procesando, setProcesando] = useState<Procesando>({ activo: false, mensaje: "" });
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [nombre, setNombre] = useState<string | null>(null);
  const avisoIdRef = useRef(0);

  const quitarAviso = useCallback((id: number) => {
    setAvisos((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const mostrarAviso = useCallback(
    (texto: string, gastoId?: string) => {
      const id = ++avisoIdRef.current;
      setAvisos((prev) => [...prev, { id, texto, gastoId }]);
      window.setTimeout(() => quitarAviso(id), 6000);
    },
    [quitarAviso]
  );

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
      setErrorVoz(null);
      setProcesando({ activo: true, mensaje: "Te estoy escuchando…" });
      try {
        const formData = new FormData();
        formData.append("audio", blob);
        const resTrans = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        const transData = (await resTrans.json().catch(() => null)) as {
          texto?: string;
        } | null;
        const texto = transData?.texto?.trim();
        if (!resTrans.ok || !texto) {
          setErrorVoz({
            mensaje:
              resTrans.status === 422
                ? "No escuché nada. Probá de nuevo hablando más alto y despacio."
                : "No pude escuchar el audio. Probá de nuevo.",
          });
          return;
        }

        setProcesando({ activo: true, mensaje: "Lo estoy interpretando…" });
        const resParse = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto, ahora: new Date().toISOString() }),
        });
        if (resParse.status === 422) {
          const { texto: escuchado } = (await resParse.json()) as {
            texto?: string;
          };
          setErrorVoz({
            escuchado,
            mensaje: escuchado
              ? `No entendí «${escuchado}» como un gasto o un ingreso.`
              : "No entendí eso como un gasto o un ingreso.",
          });
          return;
        }
        if (!resParse.ok) {
          setErrorVoz({
            mensaje: "No pude interpretar eso. Probá de nuevo o cargalo a mano.",
          });
          return;
        }
        const { gastos } = (await resParse.json()) as {
          gastos: GastoParseado[];
        };

        let fallo = false;
        for (const g of gastos) {
          try {
            const guardado = await gastosHook.crear(g);
            mostrarAviso(
              `${g.tipo === "ingreso" ? "Ingreso" : "Gasto"} guardado · ${g.descripcion}`,
              guardado.id
            );
          } catch {
            fallo = true;
          }
        }
        if (fallo) {
          setErrorVoz({
            mensaje:
              "Alguno no se pudo guardar. Revisá la lista o cargalo a mano.",
          });
        }
      } catch (e) {
        console.error("Error procesando voz:", e);
        setErrorVoz({
          mensaje: "Algo salió mal. Probá de nuevo o cargalo a mano.",
        });
      } finally {
        setProcesando({ activo: false, mensaje: "" });
      }
    },
    [gastosHook, mostrarAviso]
  );

  const abrirManual = useCallback(() => {
    setErrorVoz(null);
    grabadora.limpiarError();
    setSheet({ gasto: null, clave: `manual-${Date.now()}` });
  }, [grabadora]);

  const abrirEdicion = useCallback((gasto: Gasto) => {
    setErrorVoz(null);
    grabadora.limpiarError();
    setSheet({
      gasto: {
        id: gasto.id,
        monto: gasto.monto,
        moneda: gasto.moneda,
        tipo: gasto.tipo,
        categoria: gasto.categoria,
        descripcion: gasto.descripcion ?? "",
        fecha: gasto.fecha,
      },
      clave: `editar-${gasto.id}`,
    });
  }, [grabadora]);

  const editarDesdeAviso = useCallback(
    (gastoId: string) => {
      const g = gastosHook.gastos.find((x) => x.id === gastoId);
      if (g) abrirEdicion(g);
      setAvisos((prev) => prev.filter((a) => a.gastoId !== gastoId));
    },
    [gastosHook.gastos, abrirEdicion]
  );

  const cerrarError = useCallback(() => {
    setErrorVoz(null);
    grabadora.limpiarError();
  }, [grabadora]);

  const confirmarGasto = useCallback(
    async (gasto: GastoParseado & { id?: string }) => {
      if (gasto.id) {
        await gastosHook.actualizar(gasto.id, gasto);
        mostrarAviso("Movimiento actualizado");
      } else {
        const guardado = await gastosHook.crear(gasto);
        mostrarAviso(
          gasto.tipo === "ingreso" ? "Ingreso guardado" : "Gasto guardado",
          guardado.id
        );
      }
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
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line/60 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between max-sm:px-5 py-3">
          <div>
            <Logo className="w-14" />
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/ajustes"
              aria-label="Ajustes"
              className="grid size-10 place-items-center rounded-full border border-line bg-surface text-sub shadow-sm transition-all hover:-translate-y-0.5 hover:text-ink active:scale-95"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a7.5 7.5 0 0 0-.12-1.35l1.9-1.48-1.8-3.12-2.23.9a7.5 7.5 0 0 0-2.34-1.35L14.4 3.6h-4.8l-.51 2.15a7.5 7.5 0 0 0-2.34 1.35l-2.23-.9-1.8 3.12 1.9 1.48A7.5 7.5 0 0 0 4.5 12c0 .46.04.9.12 1.35l-1.9 1.48 1.8 3.12 2.23-.9c.68.57 1.47 1.02 2.34 1.35l.51 2.15h4.8l.51-2.15a7.5 7.5 0 0 0 2.34-1.35l2.23.9 1.8-3.12-1.9-1.48c.08-.45.12-.89.12-1.35Z" />
              </svg>
            </Link>
            <div className="grid size-10 place-items-center rounded-full border border-line bg-surface font-display text-base font-semibold text-ars">
              {(nombre ?? "D").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-5 pb-16 pt-4 lg:space-y-10 lg:px-10 lg:pb-16 lg:pt-8">
        <div className="anim-fade-up pt-1 lg:flex lg:items-end lg:justify-between">
          <div>
            <p className="text-xs text-sub lg:text-sm">
              {saludo()} |  {" "}
              {new Date().toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }).at(0)?.toUpperCase() + new Date().toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }).slice(1)}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink lg:text-5xl">
              {nombre ? `¡Hola, ${nombre}!` : "¿Qué gastaste hoy?"}
            </h1>
          </div>
        </div>

        <div className="space-y-8 lg:space-y-10">
          <div>
            <VoiceButton
              estado={procesando.activo ? "processing" : grabadora.estado}
              duracion={grabadora.duracion}
              nivel={grabadora.nivel}
              mensajeProcesando={procesando.mensaje}
              onStart={() => grabadora.empezarGrabacion(procesarAudio)}
              onStop={grabadora.detenerGrabacion}
            />
          </div>

          <div>
            <Patrimonio gastos={gastosHook.gastos} />
          </div>
        </div>

        {(errorVoz || grabadora.error) && (
          <div className="anim-fade-in rounded-3xl border border-danger/30 bg-danger/10 px-5 py-4">
            <p className="text-center text-sm font-medium text-danger">
              {errorVoz?.mensaje ?? grabadora.error}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <button
                type="button"
                onClick={abrirManual}
                className="cursor-pointer rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-105 active:scale-[0.98]"
              >
                Cargar a mano
              </button>
              <button
                type="button"
                onClick={cerrarError}
                className="cursor-pointer rounded-xl border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        <UltimosGastos
          gastos={gastosHook.gastos}
          cargando={gastosHook.cargando}
          onEliminar={eliminarGasto}
          onEditar={abrirEdicion}
          onAñadirManual={abrirManual}
        />
      </main>

      <ExpenseConfirmSheet
        key={sheet?.clave ?? "cerrado"}
        abierto={!!sheet}
        gasto={sheet?.gasto ?? null}
        onConfirm={confirmarGasto}
        onCancel={() => setSheet(null)}
        onDone={() => setSheet(null)}
      />

      {avisos.length > 0 && (
        <div className="fixed bottom-24 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col items-stretch gap-2 px-5 lg:bottom-8">
          {avisos.map((a) => (
            <div
              key={a.id}
              className="anim-pop-in flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink shadow-2xl"
            >
              <span className="min-w-0 truncate">{a.texto}</span>
              {a.gastoId && (
                <button
                  type="button"
                  onClick={() => editarDesdeAviso(a.gastoId!)}
                  className="shrink-0 cursor-pointer rounded-xl bg-ars px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:brightness-105 active:scale-[0.97]"
                >
                  Editar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
