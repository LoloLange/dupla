import type { Moneda } from "@/lib/types";

export function cn(...clases: Array<string | false | null | undefined>) {
  return clases.filter(Boolean).join(" ");
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
  return moneda === "USD" ? formatUSD(monto) : formatARS(monto);
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
