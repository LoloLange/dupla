"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useGastos } from "@/hooks/useGastos";
import {
  esCategoriaDeTipo,
  type Gasto,
  type GastoParseado,
  type Moneda,
} from "@/lib/types";
import { inicioDeRango, type RangoFecha } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeProvider";
import { usePreferencias } from "@/components/PreferenciasProvider";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { ExpenseConfirmSheet } from "@/components/voice/ExpenseConfirmSheet";
import { Patrimonio } from "@/components/dashboard/Patrimonio";
import { UltimosGastos } from "@/components/dashboard/UltimosGastos";
import { FiltrosYOrden, type Orden } from "@/components/dashboard/FiltrosYOrden";
import { Logo } from "@/components/Logo";

type Procesando = { activo: boolean; mensaje: string };
type ErrorVoz = { mensaje: string; escuchado?: string };
type Aviso = {
  id: number;
  texto: string;
  gastoId?: string;
  accion?: { etiqueta: string; alElegir: () => void };
  saliendo?: boolean;
};
type Sheet = {
  gasto: (GastoParseado & { id?: string }) | null;
  clave: string;
};

function aIsoValida(fecha?: string | null): string {
  if (fecha) {
    const d = new Date(fecha);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function useFlipList(
  items: readonly { id: number }[],
  ref: { current: HTMLDivElement | null },
) {
  const posPrevia = useRef(new Map<number, { top: number; left: number }>());

  useEffect(() => {
    const cont = ref.current;
    if (!cont) return;
    const raf = requestAnimationFrame(() => {
      const nueva = new Map<number, { top: number; left: number }>();
      cont.querySelectorAll<HTMLElement>("[data-flip-id]").forEach((nodo) => {
        const id = Number(nodo.dataset.flipId);
        if (Number.isNaN(id)) return;
        nueva.set(id, { top: nodo.offsetTop, left: nodo.offsetLeft });
      });
      for (const [id, pos] of nueva) {
        const prev = posPrevia.current.get(id);
        if (!prev) continue;
        const nodo = cont.querySelector<HTMLElement>(`[data-flip-id="${id}"]`);
        if (!nodo) continue;
        const dx = prev.left - pos.left;
        const dy = prev.top - pos.top;
        if (dx === 0 && dy === 0) continue;
        nodo.style.transition = "none";
        nodo.style.transform = `translate(${dx}px, ${dy}px)`;
        void nodo.offsetWidth;
        nodo.style.transition =
          "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)";
        nodo.style.transform = "";
      }
      posPrevia.current = nueva;
    });
    return () => cancelAnimationFrame(raf);
  }, [items, ref]);
}

function ToastItem({
  aviso,
  onQuitar,
  onEditar,
}: {
  aviso: Aviso;
  onQuitar: (id: number, conAnimacion?: boolean) => void;
  onEditar: (gastoId: string) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef({
    x: 0,
    ancho: 0,
    dx: 0,
    activo: false,
    moviendo: false,
  });

  const aplicar = (dx: number) => {
    const el = elRef.current;
    if (!el) return;
    const ancho = arrastre.current.ancho || el.offsetWidth;
    el.style.transition = "none";
    el.style.transform = `translateX(${dx}px)`;
    el.style.opacity = String(Math.max(0, 1 - Math.abs(dx) / (ancho * 0.55)));
  };

  const soltar = () => {
    const d = arrastre.current;
    if (!d.activo) return;
    d.activo = false;
    const el = elRef.current;
    if (!el) return;
    if (d.moviendo && Math.abs(d.dx) > Math.max(d.ancho * 0.3, 64)) {
      const dir = Math.sign(d.dx) || 1;
      el.style.transition = "transform 0.25s ease, opacity 0.25s ease";
      el.style.transform = `translateX(${dir * d.ancho * 1.4}px)`;
      el.style.opacity = "0";
      window.setTimeout(() => onQuitar(aviso.id, false), 250);
    } else {
      el.style.transition = "transform 0.25s ease, opacity 0.25s ease";
      el.style.transform = "translateX(0px)";
      el.style.opacity = "";
    }
  };

  return (
    <div
      ref={elRef}
      data-flip-id={aviso.id}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        const el = elRef.current;
        if (!el) return;
        arrastre.current = {
          x: e.clientX,
          ancho: el.offsetWidth,
          dx: 0,
          activo: true,
          moviendo: false,
        };
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
      }}
      onPointerMove={(e) => {
        const d = arrastre.current;
        if (!d.activo) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 6) {
          d.moviendo = true;
          d.dx = dx;
          aplicar(dx);
        }
      }}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      className={`flex cursor-grab touch-pan-y select-none items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink shadow-2xl active:cursor-grabbing ${
        aviso.saliendo ? "anim-pop-out" : "anim-pop-in"
      }`}
    >
      <span className="min-w-0 truncate">{aviso.texto}</span>
      {aviso.accion ? (
        <button
          type="button"
          onClick={() => {
            aviso.accion!.alElegir();
            onQuitar(aviso.id);
          }}
          className="shrink-0 cursor-pointer rounded-xl bg-ars px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:brightness-105 active:scale-[0.97]"
        >
          {aviso.accion.etiqueta}
        </button>
      ) : (
        aviso.gastoId && (
          <button
            type="button"
            onClick={() => onEditar(aviso.gastoId!)}
            className="shrink-0 cursor-pointer rounded-xl bg-ars px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:brightness-105 active:scale-[0.97]"
          >
            Editar
          </button>
        )
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const grabadora = useVoiceRecorder();
  const gastosHook = useGastos();
  const {
    monedaSecundaria,
    verDetalleMonedas,
    verBalance,
    cargando: preferenciasCargando,
  } = usePreferencias();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [errorVoz, setErrorVoz] = useState<ErrorVoz | null>(null);
  const [procesando, setProcesando] = useState<Procesando>({
    activo: false,
    mensaje: "",
  });
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [nombre, setNombre] = useState<string | null>(null);
  const [rango, setRango] = useState<RangoFecha>("mes");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden>("desc");
  const avisoIdRef = useRef(0);
  const listaAvisosRef = useRef<HTMLDivElement>(null);

  const gastosFiltrados = useMemo(() => {
    const desde = inicioDeRango(rango);
    const termino = busqueda.trim().toLowerCase();
    return gastosHook.gastos.filter(
      (g) =>
        new Date(g.fecha) >= desde &&
        (categorias.length === 0 || categorias.includes(g.categoria)) &&
        (monedas.length === 0 || monedas.includes(g.moneda)) &&
        (termino === "" ||
          (g.descripcion ?? "").toLowerCase().includes(termino)),
    );
  }, [gastosHook.gastos, rango, categorias, monedas, busqueda]);

  useFlipList(avisos, listaAvisosRef);

  const quitarAviso = useCallback((id: number, conAnimacion = true) => {
    if (!conAnimacion) {
      setAvisos((prev) => prev.filter((a) => a.id !== id));
      return;
    }
    setAvisos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, saliendo: true } : a)),
    );
    window.setTimeout(() => {
      setAvisos((prev) => prev.filter((a) => a.id !== id));
    }, 300);
  }, []);

  const mostrarAviso = useCallback(
    (texto: string, gastoId?: string, accion?: Aviso["accion"]) => {
      const id = ++avisoIdRef.current;
      setAvisos((prev) => [...prev, { id, texto, gastoId, accion }]);
      window.setTimeout(() => quitarAviso(id), 3500);
    },
    [quitarAviso],
  );

  useEffect(() => {
    let activo = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!activo || !data.user) return;
        const meta = data.user.user_metadata as
          | Record<string, string>
          | undefined;
        const nombre =
          meta?.full_name ??
          meta?.nombre ??
          data.user.email?.split("@")[0] ??
          null;
        setNombre(
          nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : null,
        );
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
          body: JSON.stringify({
            texto,
            ahora: new Date().toISOString(),
            offset: new Date().getTimezoneOffset(),
          }),
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
            mensaje:
              "No pude interpretar eso. Probá de nuevo o cargalo a mano.",
          });
          return;
        }
        const { gastos } = (await resParse.json()) as {
          gastos: GastoParseado[];
        };

        let fallo = false;
        const sinMonto: GastoParseado[] = [];
        for (const g of gastos) {
          if (g.monto === null) {
            sinMonto.push(g);
            continue;
          }
          try {
            const guardado = await gastosHook.crear({ ...g, monto: g.monto });
            mostrarAviso(
              `${g.tipo === "ingreso" ? "Ingreso" : "Gasto"} guardado | ${g.descripcion}`,
              guardado.id,
            );
          } catch {
            fallo = true;
          }
        }
        if (sinMonto.length > 0) {
          setErrorVoz(null);
          grabadora.limpiarError();
          setSheet({
            gasto: sinMonto[0],
            clave: `voz-falta-monto-${Date.now()}`,
          });
          if (sinMonto.length > 1) {
            mostrarAviso(
              `Faltó el monto en ${sinMonto.length} movimientos. Completalos a mano.`,
            );
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
    [gastosHook, mostrarAviso, grabadora],
  );

  const abrirManual = useCallback(() => {
    setErrorVoz(null);
    grabadora.limpiarError();
    setSheet({ gasto: null, clave: `manual-${Date.now()}` });
  }, [grabadora]);

  const abrirEdicion = useCallback(
    (gasto: Gasto) => {
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
          fecha: aIsoValida(gasto.fecha),
          recurrencia: gasto.recurrencia,
          tags: gasto.tags ?? [],
          comentario: gasto.comentario ?? "",
        },
        clave: `editar-${gasto.id}`,
      });
    },
    [grabadora],
  );

  const editarDesdeAviso = useCallback(
    (gastoId: string) => {
      const g = gastosHook.gastos.find((x) => x.id === gastoId);
      if (g) abrirEdicion(g);
      const ids = avisos.filter((a) => a.gastoId === gastoId).map((a) => a.id);
      ids.forEach((id) => quitarAviso(id));
    },
    [gastosHook.gastos, abrirEdicion, avisos, quitarAviso],
  );

  const cerrarError = useCallback(() => {
    setErrorVoz(null);
    grabadora.limpiarError();
  }, [grabadora]);

  const confirmarGasto = useCallback(
    async (gasto: GastoParseado & { id?: string }) => {
      if (gasto.monto === null) return;
      if (gasto.id) {
        await gastosHook.actualizar(gasto.id, { ...gasto, monto: gasto.monto });
        mostrarAviso("Movimiento actualizado");
      } else {
        const guardado = await gastosHook.crear({
          ...gasto,
          monto: gasto.monto,
        });
        mostrarAviso(
          gasto.tipo === "ingreso" ? "Ingreso guardado" : "Gasto guardado",
          guardado.id,
        );
      }
    },
    [gastosHook, mostrarAviso],
  );

  const eliminarGasto = useCallback(
    (gasto: Gasto) => {
      gastosHook.eliminar(gasto.id);
      mostrarAviso(
        gasto.tipo === "ingreso" ? "Ingreso eliminado" : "Movimiento eliminado",
        undefined,
        {
          etiqueta: "Deshacer",
          alElegir: () => {
            gastosHook
              .crear({
                monto: gasto.monto,
                moneda: gasto.moneda,
                tipo: gasto.tipo,
                categoria: esCategoriaDeTipo(gasto.tipo, gasto.categoria)
                  ? gasto.categoria
                  : "Otros",
                descripcion: gasto.descripcion ?? "",
                fecha: aIsoValida(gasto.fecha),
                recurrencia: gasto.recurrencia ?? undefined,
                tags: gasto.tags ?? [],
                comentario: gasto.comentario ?? undefined,
              })
              .then((restaurado) => {
                mostrarAviso(
                  gasto.tipo === "ingreso"
                    ? "Ingreso restaurado"
                    : "Movimiento restaurado",
                  restaurado.id,
                );
              })
              .catch(() => {
                mostrarAviso("No se pudo deshacer la eliminación");
              });
          },
        },
      );
    },
    [gastosHook, mostrarAviso],
  );

  const cerrarSesion = useCallback(async () => {
    await createClient().auth.signOut();
    router.push("/login");
  }, [router]);

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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 12a7.5 7.5 0 0 0-.12-1.35l1.9-1.48-1.8-3.12-2.23.9a7.5 7.5 0 0 0-2.34-1.35L14.4 3.6h-4.8l-.51 2.15a7.5 7.5 0 0 0-2.34 1.35l-2.23-.9-1.8 3.12 1.9 1.48A7.5 7.5 0 0 0 4.5 12c0 .46.04.9.12 1.35l-1.9 1.48 1.8 3.12 2.23-.9c.68.57 1.47 1.02 2.34 1.35l.51 2.15h4.8l.51-2.15a7.5 7.5 0 0 0 2.34-1.35l2.23.9 1.8-3.12-1.9-1.48c.08-.45.12-.89.12-1.35Z"
                />
              </svg>
            </Link>
            <button
              type="button"
              onClick={cerrarSesion}
              aria-label="Cerrar sesión"
              className="grid size-10 cursor-pointer place-items-center rounded-full border border-line bg-surface text-sub shadow-sm transition-all hover:-translate-y-0.5 hover:text-danger active:scale-95"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                />
              </svg>
            </button>
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
              {saludo()} |{" "}
              {new Date()
                .toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
                .at(0)
                ?.toUpperCase() +
                new Date()
                  .toLocaleDateString("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                  .slice(1)}
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

          <div className="pt-3 lg:pt-5">
            <div className="mb-4">
              <FiltrosYOrden
                rango={rango}
                onChangeRango={setRango}
                categorias={categorias}
                onChangeCategorias={setCategorias}
                monedas={monedas}
                onChangeMonedas={setMonedas}
                busqueda={busqueda}
                onChangeBusqueda={setBusqueda}
                orden={orden}
                onChangeOrden={setOrden}
              />
            </div>
            <Patrimonio
              gastos={gastosFiltrados}
              cargando={gastosHook.cargando}
              rango={rango}
              monedaSecundaria={monedaSecundaria}
              verDetalleMonedas={verDetalleMonedas}
              verBalance={verBalance}
              preferenciasCargando={preferenciasCargando}
            />
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
          gastos={gastosFiltrados}
          hayMasGastos={gastosHook.gastos.length > gastosFiltrados.length}
          cargando={gastosHook.cargando}
          orden={orden}
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
        <div
          ref={listaAvisosRef}
          className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col items-stretch gap-2 px-5 lg:bottom-8 lg:left-1/2 lg:right-auto lg:top-auto lg:-translate-x-1/2"
        >
          {avisos.map((a) => (
            <ToastItem
              key={a.id}
              aviso={a}
              onQuitar={quitarAviso}
              onEditar={editarDesdeAviso}
            />
          ))}
        </div>
      )}
    </div>
  );
}
