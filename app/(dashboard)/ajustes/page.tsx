"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { usePreferencias } from "@/components/PreferenciasProvider";
import { MONEDAS_SECUNDARIAS } from "@/lib/types";
import type { MonedaSecundaria } from "@/lib/types";
import {
  TEMAS,
  ETIQUETAS_CATEGORIA,
  type CategoriaTema,
} from "@/lib/temas-data";

const CATEGORIAS = Object.keys(ETIQUETAS_CATEGORIA) as CategoriaTema[];

function MiniPreview({
  fondo,
  primario,
}: {
  fondo: string | null;
  primario: string | null;
}) {
  return (
    <div
      className="relative flex h-24 items-end overflow-hidden rounded-xl border border-black/10 p-3 transition-transform duration-200"
      style={{ background: fondo ?? "var(--bg)" }}
    >
      <div className="w-full space-y-1.5">
        <div className="h-1.5 w-2/3 rounded-full" style={{ background: primario ?? "var(--ars)" }} />
        <div
          className="h-1.5 w-full rounded-full"
          style={{
            background: primario
              ? `color-mix(in oklab, ${primario} 45%, transparent)`
              : "var(--ars-soft)",
          }}
        />
        <div className="h-1.5 w-1/3 rounded-full" style={{ background: primario ?? "var(--ars)" }} />
      </div>
    </div>
  );
}

export default function AjustesPage() {
  const { tema, variante, setTema, alternarVariante } = useTheme();
  const { monedaSecundaria, setMonedaSecundaria } = usePreferencias();
  const [categoria, setCategoria] = useState<CategoriaTema>("minimal");

  const temasDeCategoria = useMemo(
    () => TEMAS.filter((t) => t.categoria === categoria),
    [categoria]
  );

  const elegirMoneda = (m: MonedaSecundaria) => setMonedaSecundaria(m);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 lg:px-10 lg:pb-16 lg:pt-8">
      <div className="anim-fade-up">
        <Link
          href="/"
          aria-label="Volver al inicio"
          className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-sub shadow-sm transition-all hover:-translate-y-0.5 hover:text-ink active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-sub lg:text-sm">
              <Link href="/" className="transition-colors hover:text-ink">
                dupla
              </Link>{" "}
              | ajustes
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink lg:text-5xl">
              Configuración
            </h1>
            <p className="mt-2 text-sm text-sub">
              Tu perfil, tus reglas. Se sincroniza entre dispositivos.
            </p>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
            Moneda secundaria
          </h2>
          <p className="mt-1 text-sm text-sub">
            Elegí la moneda que acompaña a los pesos en tu balance. Si la
            desactivás, el dashboard muestra solo el balance total.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMonedaSecundaria(null)}
              className={`cursor-pointer rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                monedaSecundaria === null
                  ? "border-ars bg-ars-soft shadow-md"
                  : "border-line bg-surface hover:border-sub/50"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span
                  className={`grid size-5 place-items-center rounded-full border-2 ${
                    monedaSecundaria === null
                      ? "border-ars"
                      : "border-sub/40"
                  }`}
                >
                  {monedaSecundaria === null && (
                    <span className="size-2.5 rounded-full bg-ars" />
                  )}
                </span>
                Sin moneda secundaria
              </span>
              <span className="mt-1 block text-xs text-sub">
                Solo el balance total en pesos
              </span>
            </button>

            {MONEDAS_SECUNDARIAS.map((m) => {
              const activa = monedaSecundaria === m.codigo;
              return (
                <button
                  key={m.codigo}
                  type="button"
                  onClick={() => elegirMoneda(m.codigo)}
                  className={`cursor-pointer rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                    activa
                      ? "border-ars bg-ars-soft shadow-md"
                      : "border-line bg-surface hover:border-sub/50"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <span
                      className={`grid size-5 place-items-center rounded-full border-2 ${
                        activa ? "border-ars" : "border-sub/40"
                      }`}
                    >
                      {activa && <span className="size-2.5 rounded-full bg-ars" />}
                    </span>
                    {m.etiqueta}
                  </span>
                  <span className="mt-1 block text-xs text-sub">
                    {m.codigo}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[11px] text-faint">
            Las cotizaciones vienen de DolarAPI y se actualizan cada 10
            minutos.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
            Apariencia
          </h2>
          <p className="mt-1 text-sm text-sub">
            Elegí la paleta que te haga sentir como en casa. Se guarda en tu
            perfil y se sincroniza entre dispositivos.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm font-medium text-sub">Modo</span>
            <div className="flex rounded-full border border-line bg-surface p-1">
              <button
                type="button"
                onClick={() => variante === "dark" && alternarVariante()}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  variante === "light"
                    ? "bg-ars text-white shadow"
                    : "text-sub hover:text-ink"
                }`}
              >
                Claro
              </button>
              <button
                type="button"
                onClick={() => variante === "light" && alternarVariante()}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  variante === "dark"
                    ? "bg-ars text-white shadow"
                    : "text-sub hover:text-ink"
                }`}
              >
                Oscuro
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoria(cat)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  categoria === cat
                    ? "bg-ink text-bg"
                    : "border border-line bg-surface text-sub hover:text-ink"
                }`}
              >
                {ETIQUETAS_CATEGORIA[cat]}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {temasDeCategoria.map((t) => {
              const activo = tema === `${t.slug}-${variante}`;
              const colores = t.colores[variante];
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => setTema(`${t.slug}-${variante}`)}
                  className={`group cursor-pointer rounded-2xl border p-2 text-left transition-all hover:-translate-y-0.5 ${
                    activo
                      ? "border-ars bg-ars-soft shadow-md"
                      : "border-line bg-surface hover:border-sub/50"
                  }`}
                >
                  <MiniPreview
                    fondo={colores.fondo}
                    primario={colores.primario}
                  />
                  <span className="mt-2 flex items-center justify-between px-1 pb-1">
                    <span
                      className={`truncate text-sm font-medium ${
                        activo ? "text-ars-strong" : "text-ink"
                      }`}
                    >
                      {t.nombre}
                    </span>
                    {activo && (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ars text-white">
                        <svg
                          viewBox="0 0 24 24"
                          className="size-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
