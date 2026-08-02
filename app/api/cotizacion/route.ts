import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_MS = 10 * 60 * 1000;

let cache: { venta: number; compra: number; fecha: string } | null = null;
let cacheHora = 0;

export async function GET() {
  const ahora = Date.now();
  if (cache && ahora - cacheHora < CACHE_MS) {
    return NextResponse.json(cache);
  }

  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/oficial", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`dolarapi respondió ${res.status}`);
    const data = (await res.json()) as {
      compra?: number;
      venta?: number;
      fechaActualizacion?: string;
    };
    if (typeof data.venta !== "number" || typeof data.compra !== "number") {
      throw new Error("dolarapi devolvió un formato inesperado");
    }
    cache = {
      venta: data.venta,
      compra: data.compra,
      fecha: data.fechaActualizacion ?? new Date().toISOString(),
    };
    cacheHora = Date.now();
    return NextResponse.json(cache);
  } catch (error) {
    console.error("[cotizacion] error:", error);
    if (cache) {
      return NextResponse.json({ ...cache, stale: true });
    }
    return NextResponse.json(
      { error: "No se pudo obtener la cotización" },
      { status: 502 }
    );
  }
}
