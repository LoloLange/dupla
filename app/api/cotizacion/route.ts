import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_MS = 10 * 60 * 1000;

export type Cotizacion = {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fecha: string;
};

let cache: Cotizacion[] | null = null;
let cacheHora = 0;

export async function GET() {
  const ahora = Date.now();
  if (cache && ahora - cacheHora < CACHE_MS) {
    return NextResponse.json(cache);
  }

  try {
    const res = await fetch("https://dolarapi.com/v1/dolares", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`dolarapi respondió ${res.status}`);
    const data = (await res.json()) as Array<{
      casa?: string;
      nombre?: string;
      compra?: number;
      venta?: number;
      fechaActualizacion?: string;
    }>;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("dolarapi devolvió un formato inesperado");
    }
    cache = data
      .filter(
        (d) => typeof d.venta === "number" && typeof d.compra === "number"
      )
      .map((d) => ({
        casa: d.casa ?? "",
        nombre: d.nombre ?? d.casa ?? "",
        compra: d.compra as number,
        venta: d.venta as number,
        fecha: d.fechaActualizacion ?? new Date().toISOString(),
      }));
    cacheHora = Date.now();
    return NextResponse.json(cache);
  } catch (error) {
    console.error("[cotizacion] error:", error);
    if (cache) {
      return NextResponse.json(cache);
    }
    return NextResponse.json(
      { error: "No se pudo obtener la cotización" },
      { status: 502 }
    );
  }
}
