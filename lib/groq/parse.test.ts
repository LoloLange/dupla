import { describe, expect, it } from "vitest";
import {
  normalizarMovimientos,
  parsearMonto,
  resolverFecha,
} from "@/lib/groq/parse";

describe("parsearMonto", () => {
  it("acepta números positivos", () => {
    expect(parsearMonto(8000)).toBe(8000);
    expect(parsearMonto(15.5)).toBe(15.5);
  });

  it("rechaza números no positivos o no finitos", () => {
    expect(parsearMonto(0)).toBeNull();
    expect(parsearMonto(-5)).toBeNull();
    expect(parsearMonto(Number.NaN)).toBeNull();
    expect(parsearMonto(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("parsea strings numéricos", () => {
    expect(parsearMonto("8000")).toBe(8000);
    expect(parsearMonto("15.5")).toBe(15.5);
  });

  it("interpreta separador de miles con punto (1.500)", () => {
    expect(parsearMonto("1.500")).toBe(1500);
  });

  it("interpreta decimal con coma (8,50)", () => {
    expect(parsearMonto("8,50")).toBe(8.5);
  });

  it("interpreta 1.234,56 como miles + decimales", () => {
    expect(parsearMonto("1.234,56")).toBe(1234.56);
  });

  it("devuelve null sin dígitos o para tipos raros", () => {
    expect(parsearMonto("abc")).toBeNull();
    expect(parsearMonto(null)).toBeNull();
    expect(parsearMonto(undefined)).toBeNull();
  });
});

describe("normalizarMovimientos", () => {
  const ahora = "2026-08-06T12:00:00";
  const offset = 180;

  it("normaliza un objeto envuelto en {gasto}", () => {
    const [g] = normalizarMovimientos(
      {
        gasto: {
          tipo: "gasto",
          monto: "8.000",
          moneda: "ARS",
          categoria: "Supermercado",
          descripcion: "Coto",
          fecha: "2026-08-06T10:00:00",
          fecha_hint: "",
        },
      },
      "gasté 8 mil en el coto",
      ahora,
      offset
    );
    expect(g).toMatchObject({
      tipo: "gasto",
      monto: 8000,
      moneda: "ARS",
      categoria: "Supermercado",
      descripcion: "Coto",
    });
    expect(g.fecha).toBe("2026-08-06T13:00:00.000Z");
  });

  it("soporta varios movimientos en el array", () => {
    const movs = normalizarMovimientos(
      {
        movimientos: [
          {
            tipo: "gasto",
            monto: 8000,
            moneda: "ARS",
            categoria: "Supermercado",
            descripcion: "Coto",
            fecha: "2026-08-06T10:00:00",
            fecha_hint: "",
          },
          {
            tipo: "gasto",
            monto: 5000,
            moneda: "ARS",
            categoria: "Entretenimiento",
            descripcion: "Cine",
            fecha: "2026-08-06T10:00:00",
            fecha_hint: "",
          },
        ],
      },
      "gasté 8 mil en el coto y 5 mil en el cine",
      ahora,
      offset
    );
    expect(movs).toHaveLength(2);
    expect(movs[0].monto).toBe(8000);
    expect(movs[1].monto).toBe(5000);
  });

  it("conserva monto null cuando no hay monto en la frase", () => {
    const [g] = normalizarMovimientos(
      {
        movimientos: [
          {
            tipo: "gasto",
            monto: null,
            moneda: "ARS",
            categoria: "Comida y bares",
            descripcion: "Compré pan",
            fecha: "2026-08-06T12:00:00",
            fecha_hint: "",
          },
        ],
      },
      "compré pan",
      ahora,
      offset
    );
    expect(g.monto).toBeNull();
  });

  it("cae a ARS si la moneda no es válida", () => {
    const [g] = normalizarMovimientos(
      {
        movimientos: [
          {
            tipo: "gasto",
            monto: 100,
            moneda: "GBP",
            categoria: "Otros",
            descripcion: "Compras",
            fecha: "2026-08-06T12:00:00",
            fecha_hint: "",
          },
        ],
      },
      "gasté 100 libras",
      ahora,
      offset
    );
    expect(g.moneda).toBe("ARS");
  });

  it("mapea la categoría al tipo y usa Otros como fallback", () => {
    const [ingreso] = normalizarMovimientos(
      {
        movimientos: [
          {
            tipo: "ingreso",
            monto: 1000,
            moneda: "ARS",
            categoria: "Sueldo y aguinaldo",
            descripcion: "",
            fecha: "2026-08-06T12:00:00",
            fecha_hint: "",
          },
        ],
      },
      "cobré sueldo y aguinaldo",
      ahora,
      offset
    );
    expect(ingreso.categoria).toBe("Sueldo");
    expect(ingreso.descripcion).toBe("Sueldo");

    const [gasto] = normalizarMovimientos(
      {
        movimientos: [
          {
            tipo: "gasto",
            monto: 1000,
            moneda: "ARS",
            categoria: "Sueldo y aguinaldo",
            descripcion: "Sueldo",
            fecha: "2026-08-06T12:00:00",
            fecha_hint: "",
          },
        ],
      },
      "algo",
      ahora,
      offset
    );
    expect(gasto.categoria).toBe("Otros");
  });

  it("lanza si la respuesta no es un objeto", () => {
    expect(() =>
      normalizarMovimientos("no soy json", "frase", ahora, offset)
    ).toThrow();
  });
});

describe("resolverFecha", () => {
  const offset = 180;

  it("interpreta 'ayer' relativo a la hora local", () => {
    const fecha = resolverFecha(
      "ayer",
      "2026-08-05T09:00:00",
      "2026-08-06T12:00:00",
      offset
    );
    expect(fecha).toBe("2026-08-05T12:00:00.000Z");
  });

  it("usa la fecha del LLM cuando no hay hint", () => {
    const fecha = resolverFecha(
      "",
      "2026-08-06T10:00:00",
      "2026-08-06T12:00:00",
      offset
    );
    expect(fecha).toBe("2026-08-06T13:00:00.000Z");
  });

  it("toma la hora del hint y el día de la frase", () => {
    const fecha = resolverFecha(
      "ayer a las 9 de la noche",
      "2026-08-05T21:00:00",
      "2026-08-06T12:00:00",
      offset
    );
    expect(fecha).toBe("2026-08-06T00:00:00.000Z");
  });
});
