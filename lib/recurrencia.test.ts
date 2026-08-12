import { describe, expect, it } from "vitest";
import {
  etiquetaRecurrencia,
  filaDesdeRecurrencia,
  recurrenciaDesdeFila,
} from "@/lib/recurrencia";
import type { Recurrencia } from "@/lib/types";

describe("filaDesdeRecurrencia", () => {
  it("aplanada en null cuando no hay recurrencia", () => {
    expect(filaDesdeRecurrencia(null)).toEqual({
      recurrencia_frecuencia: null,
      recurrencia_intervalo: 1,
      recurrencia_dia_semana: null,
      recurrencia_dia_mes: null,
    });
    expect(filaDesdeRecurrencia(undefined)).toEqual({
      recurrencia_frecuencia: null,
      recurrencia_intervalo: 1,
      recurrencia_dia_semana: null,
      recurrencia_dia_mes: null,
    });
  });

  it("aplanada semanal", () => {
    expect(
      filaDesdeRecurrencia({
        frecuencia: "semanal",
        intervalo: 2,
        diaSemana: 3,
      })
    ).toEqual({
      recurrencia_frecuencia: "semanal",
      recurrencia_intervalo: 2,
      recurrencia_dia_semana: 3,
      recurrencia_dia_mes: null,
    });
  });

  it("aplanada mensual", () => {
    expect(
      filaDesdeRecurrencia({
        frecuencia: "mensual",
        intervalo: 3,
        diaMes: 15,
      })
    ).toEqual({
      recurrencia_frecuencia: "mensual",
      recurrencia_intervalo: 3,
      recurrencia_dia_semana: null,
      recurrencia_dia_mes: 15,
    });
  });
});

describe("recurrenciaDesdeFila", () => {
  it("devuelve null sin frecuencia", () => {
    expect(
      recurrenciaDesdeFila({
        recurrencia_frecuencia: null,
        recurrencia_intervalo: null,
        recurrencia_dia_semana: null,
        recurrencia_dia_mes: null,
      })
    ).toBeNull();
  });

  it("semanal con defaults", () => {
    expect(
      recurrenciaDesdeFila({
        recurrencia_frecuencia: "semanal",
        recurrencia_intervalo: null,
        recurrencia_dia_semana: null,
        recurrencia_dia_mes: null,
      })
    ).toEqual({ frecuencia: "semanal", intervalo: 1, diaSemana: 0 });
  });

  it("roundtrip semanal y mensual", () => {
    const semanal: Recurrencia = {
      frecuencia: "semanal",
      intervalo: 4,
      diaSemana: 1,
    };
    const mensual: Recurrencia = {
      frecuencia: "mensual",
      intervalo: 1,
      diaMes: 31,
    };
    expect(recurrenciaDesdeFila(filaDesdeRecurrencia(semanal))).toEqual(semanal);
    expect(recurrenciaDesdeFila(filaDesdeRecurrencia(mensual))).toEqual(mensual);
  });
});

describe("etiquetaRecurrencia", () => {
  it("semanal domingo", () => {
    expect(
      etiquetaRecurrencia({ frecuencia: "semanal", intervalo: 1, diaSemana: 0 })
    ).toBe("Se repite todas las semanas los domingos");
  });

  it("semanal lunes sin doble s", () => {
    expect(
      etiquetaRecurrencia({ frecuencia: "semanal", intervalo: 1, diaSemana: 1 })
    ).toBe("Se repite todas las semanas los lunes");
  });

  it("semanal cada N semanas", () => {
    expect(
      etiquetaRecurrencia({ frecuencia: "semanal", intervalo: 2, diaSemana: 5 })
    ).toBe("Se repite cada 2 semanas los viernes");
  });

  it("mensual", () => {
    expect(
      etiquetaRecurrencia({ frecuencia: "mensual", intervalo: 1, diaMes: 15 })
    ).toBe("Se repite todos los meses el día 15");
  });

  it("mensual cada N meses", () => {
    expect(
      etiquetaRecurrencia({ frecuencia: "mensual", intervalo: 3, diaMes: 1 })
    ).toBe("Se repite cada 3 meses el día 1");
  });

  it("null cuando no hay recurrencia", () => {
    expect(etiquetaRecurrencia(null)).toBeNull();
    expect(etiquetaRecurrencia(undefined)).toBeNull();
  });
});
