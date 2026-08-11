import type { Moneda, MonedaSecundaria } from "@/lib/types";

export function cn(...clases: Array<string | false | null | undefined>) {
  return clases.filter(Boolean).join(" ");
}

const LOCALE_POR_MONEDA: Record<MonedaSecundaria, string> = {
  USD: "es-AR",
  EUR: "es-AR",
  BRL: "pt-BR",
  CLP: "es-CL",
  UYU: "es-UY",
};

export function formatMoneda(monto: number, moneda: MonedaSecundaria): string {
  if (moneda === "EUR") {
    return `€${new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto)}`;
  }
  if (moneda === "CLP") {
    return `$${new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 0,
    }).format(monto)} CLP`;
  }
  if (moneda === "UYU") {
    return `$${new Intl.NumberFormat("es-UY", {
      maximumFractionDigits: 2,
    }).format(monto)} UYU`;
  }
  return new Intl.NumberFormat(LOCALE_POR_MONEDA[moneda], {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 2,
  }).format(monto);
}

export function formatARS(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: monto % 1 === 0 ? 0 : 2,
  }).format(monto);
}

export function formatUSD(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(monto);
}

export function formatMonto(monto: number, moneda: Moneda): string {
  if (moneda === "ARS") return formatARS(monto);
  return formatMoneda(monto, moneda);
}

export function formatSecundaria(
  monto: number,
  moneda: MonedaSecundaria
): string {
  return formatMoneda(monto, moneda);
}

export function formatARSCompacto(monto: number): string {
  const signo = monto < 0 ? "-" : "";
  const abs = Math.abs(monto);
  if (abs >= 1_000_000) {
    return `${signo}$${(abs / 1_000_000).toLocaleString("es-AR", {
      maximumFractionDigits: 1,
    })}M`;
  }
  if (abs >= 1_000) {
    return `${signo}$${(abs / 1_000).toLocaleString("es-AR", {
      maximumFractionDigits: 1,
    })}K`;
  }
  return `${signo}$${abs.toLocaleString("es-AR")}`;
}

export function aInicioDiaLocal(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export function diffDias(iso: string): number {
  const hoy = aInicioDiaLocal(new Date());
  const dia = aInicioDiaLocal(new Date(iso));
  return Math.round((hoy.getTime() - dia.getTime()) / 86_400_000);
}

export function formatDiaGrupo(iso: string): string {
  const diff = diffDias(iso);
  if (diff <= 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff <= 6) {
    const nombre = new Date(iso).toLocaleDateString("es-AR", {
      weekday: "long",
    });
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  }
  return formatFechaCorta(iso);
}

export function formatFechaCorta(iso: string): string {
  const fecha = new Date(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);

  if (fecha.toDateString() === hoy.toDateString()) return "Hoy";
  if (fecha.toDateString() === ayer.toDateString()) return "Ayer";
  return fecha.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function aISOString(fecha: Date): string {
  return fecha.toISOString();
}

export function hoyISO(): string {
  return new Date().toISOString();
}

export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type RangoFecha = "hoy" | "7d" | "mes" | "3m" | "6m" | "ano";

export const RANGOS_FECHA: { id: RangoFecha; etiqueta: string }[] = [
  { id: "hoy", etiqueta: "Hoy" },
  { id: "7d", etiqueta: "Últimos 7 días" },
  { id: "mes", etiqueta: "Este mes" },
  { id: "3m", etiqueta: "3 meses" },
  { id: "6m", etiqueta: "6 meses" },
  { id: "ano", etiqueta: "Un año" },
];

export function inicioDeRango(rango: RangoFecha, ahora = new Date()): Date {
  const hoy = aInicioDiaLocal(ahora);
  switch (rango) {
    case "hoy":
      return hoy;
    case "7d": {
      const d = new Date(hoy);
      d.setDate(d.getDate() - 6);
      return d;
    }
    case "mes":
      return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    case "3m":
      return new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1);
    case "6m":
      return new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
    case "ano":
      return new Date(ahora.getFullYear() - 1, ahora.getMonth(), 1);
  }
}

export function etiquetaRango(rango: RangoFecha): string {
  switch (rango) {
    case "hoy":
      return "hoy";
    case "7d":
      return "en los últimos 7 días";
    case "mes":
      return "este mes";
    case "3m":
      return "en los últimos 3 meses";
    case "6m":
      return "en los últimos 6 meses";
    case "ano":
      return "en el último año";
  }
}
