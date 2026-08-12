import { describe, expect, it } from "vitest";
import {
  aInicioDiaLocal,
  cn,
  formatARS,
  formatARSCompacto,
  formatDiaGrupo,
  formatMoneda,
  formatMonto,
  inicioDeRango,
  slugificar,
} from "@/lib/utils";

describe("cn", () => {
  it("une clases y descarta falsy", () => {
    expect(cn("a", "b", false, null, undefined, "c")).toBe("a b c");
    expect(cn()).toBe("");
  });
});

describe("formatARS", () => {
  it("formatea enteros sin decimales", () => {
    const salida = formatARS(8000);
    expect(salida).toContain("8.000");
    expect(salida).toContain("$");
  });

  it("formatea con decimales", () => {
    expect(formatARS(1234.5)).toContain("1.234,5");
  });
});

describe("formatMonto", () => {
  it("delega a formatARS para ARS", () => {
    expect(formatMonto(8000, "ARS")).toBe(formatARS(8000));
  });

  it("formatea euros con símbolo", () => {
    expect(formatMoneda(50, "EUR")).toBe("€50,00");
  });

  it("formatea dólares con miles", () => {
    expect(formatMoneda(1000000, "USD")).toContain("1.000.000");
  });
});

describe("formatARSCompacto", () => {
  it("millones, miles y centenas", () => {
    expect(formatARSCompacto(2_000_000)).toBe("$2M");
    expect(formatARSCompacto(2000)).toBe("$2K");
    expect(formatARSCompacto(500)).toBe("$500");
  });

  it("maneja signo negativo", () => {
    expect(formatARSCompacto(-1500)).toBe("-$1,5K");
  });
});

describe("inicioDeRango", () => {
  const ahora = new Date(2026, 7, 15, 10, 30, 0); // 15 ago 2026 10:30

  it("mes arranca el primer día del mes", () => {
    const inicio = inicioDeRango("mes", ahora);
    expect(inicio.getFullYear()).toBe(2026);
    expect(inicio.getMonth()).toBe(7);
    expect(inicio.getDate()).toBe(1);
    expect(inicio.getHours()).toBe(0);
  });

  it("hoy arranca a las 00:00", () => {
    const inicio = inicioDeRango("hoy", ahora);
    expect(inicio.getTime()).toBe(aInicioDiaLocal(ahora).getTime());
  });

  it("7d resta 6 días", () => {
    const inicio = inicioDeRango("7d", ahora);
    expect(inicio.getDate()).toBe(9);
  });

  it("ano arranca un año antes", () => {
    const inicio = inicioDeRango("ano", ahora);
    expect(inicio.getFullYear()).toBe(2025);
    expect(inicio.getMonth()).toBe(7);
    expect(inicio.getDate()).toBe(1);
  });
});

describe("formatDiaGrupo", () => {
  it("hoy y ayer", () => {
    expect(formatDiaGrupo(new Date().toISOString())).toBe("Hoy");
    const ayer = new Date(Date.now() - 86_400_000).toISOString();
    expect(formatDiaGrupo(ayer)).toBe("Ayer");
  });
});

describe("slugificar", () => {
  it("normaliza y separa con guiones", () => {
    expect(slugificar("¡Hola, Mundo!")).toBe("hola-mundo");
    expect(slugificar("¿Cuánto  cuesta?")).toBe("cuanto-cuesta");
    expect(slugificar("Miércoles y sábado")).toBe("miercoles-y-sabado");
  });
});
