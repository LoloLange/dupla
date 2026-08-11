import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_MS = 10 * 60 * 1000;

export type Cotizacion = {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fecha: string;
  moneda?: string;
};

type CacheEntrada = { datos: Cotizacion[]; hora: number };

let cacheDolares: CacheEntrada | null = null;
let cacheOficiales: CacheEntrada | null = null;
const cacheMonedas = new Map<string, CacheEntrada>();

async function fetchDolares(): Promise<Cotizacion[]> {
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
  return data
    .filter((d) => typeof d.venta === "number" && typeof d.compra === "number")
    .map((d) => ({
      casa: d.casa ?? "",
      nombre: d.nombre ?? d.casa ?? "",
      compra: d.compra as number,
      venta: d.venta as number,
      fecha: d.fechaActualizacion ?? new Date().toISOString(),
    }));
}

async function fetchMoneda(moneda: string): Promise<Cotizacion[]> {
  const res = await fetch(`https://dolarapi.com/v1/cotizaciones/${moneda}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`dolarapi respondió ${res.status}`);
  const d = (await res.json()) as {
    moneda?: string;
    casa?: string;
    nombre?: string;
    compra?: number;
    venta?: number;
    fechaActualizacion?: string;
  };
  if (typeof d?.venta !== "number" || typeof d?.compra !== "number") {
    throw new Error("dolarapi devolvió un formato inesperado");
  }
  const casa = d.casa ?? moneda.toUpperCase();
  return [
    {
      casa,
      nombre: d.nombre ?? casa,
      compra: d.compra,
      venta: d.venta,
      fecha: d.fechaActualizacion ?? new Date().toISOString(),
    },
  ];
}

async function fetchOficiales(): Promise<Cotizacion[]> {
  const res = await fetch("https://dolarapi.com/v1/cotizaciones", {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`dolarapi respondió ${res.status}`);
  const data = (await res.json()) as Array<{
    moneda?: string;
    casa?: string;
    nombre?: string;
    compra?: number;
    venta?: number;
    fechaActualizacion?: string;
  }>;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("dolarapi devolvió un formato inesperado");
  }
  return data
    .filter((d) => typeof d.venta === "number" && typeof d.compra === "number")
    .map((d) => ({
      moneda: (d.moneda ?? "").toUpperCase(),
      casa: d.casa ?? "oficial",
      nombre: d.nombre ?? d.moneda ?? "oficial",
      compra: d.compra as number,
      venta: d.venta as number,
      fecha: d.fechaActualizacion ?? new Date().toISOString(),
    }));
}

export async function GET(req: NextRequest) {
  const ahora = Date.now();
  const oficiales =
    req.nextUrl.searchParams.get("oficiales") === "1" ||
    req.nextUrl.searchParams.get("oficiales") === "true";

  if (oficiales) {
    if (cacheOficiales && ahora - cacheOficiales.hora < CACHE_MS) {
      return NextResponse.json(cacheOficiales.datos);
    }
    try {
      const datos = await fetchOficiales();
      cacheOficiales = { datos, hora: Date.now() };
      return NextResponse.json(datos);
    } catch (error) {
      console.error("[cotizacion] error (oficiales):", error);
      if (cacheOficiales) return NextResponse.json(cacheOficiales.datos);
      return NextResponse.json(
        { error: "No se pudo obtener la cotización" },
        { status: 502 }
      );
    }
  }

  const moneda = (req.nextUrl.searchParams.get("moneda") ?? "USD").toUpperCase();

  if (moneda === "USD") {
    if (cacheDolares && ahora - cacheDolares.hora < CACHE_MS) {
      return NextResponse.json(cacheDolares.datos);
    }
    try {
      const datos = await fetchDolares();
      cacheDolares = { datos, hora: Date.now() };
      return NextResponse.json(datos);
    } catch (error) {
      console.error("[cotizacion] error:", error);
      if (cacheDolares) return NextResponse.json(cacheDolares.datos);
      return NextResponse.json(
        { error: "No se pudo obtener la cotización" },
        { status: 502 }
      );
    }
  }

  const entrada = cacheMonedas.get(moneda);
  if (entrada && ahora - entrada.hora < CACHE_MS) {
    return NextResponse.json(entrada.datos);
  }

  try {
    const datos = await fetchMoneda(moneda);
    cacheMonedas.set(moneda, { datos, hora: Date.now() });
    return NextResponse.json(datos);
  } catch (error) {
    console.error(`[cotizacion] error (${moneda}):`, error);
    if (entrada) return NextResponse.json(entrada.datos);
    return NextResponse.json(
      { error: "No se pudo obtener la cotización" },
      { status: 502 }
    );
  }
}
