import type { Recurrencia } from "@/lib/types";

export const NOMBRES_DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

export function etiquetaRecurrencia(
  r: Recurrencia | null | undefined
): string | null {
  if (!r) return null;
  if (r.frecuencia === "semanal") {
    const nombre = NOMBRES_DIAS_SEMANA[r.diaSemana];
    const dias =
      nombre === undefined
        ? "ese día"
        : `los ${nombre.endsWith("s") ? nombre : `${nombre}s`}`;
    const frecuencia =
      r.intervalo > 1
        ? `cada ${r.intervalo} semanas`
        : r.intervalo === 1
          ? "todas las semanas"
          : "";
    return `Se repite ${frecuencia} ${dias}`;
  }
  const frecuencia =
    r.intervalo > 1
      ? `cada ${r.intervalo} meses`
      : r.intervalo === 1
        ? "todos los meses"
        : "";
  return `Se repite ${frecuencia} el día ${r.diaMes}`;
}

export type FilaRecurrencia = {
  recurrencia_frecuencia: string | null;
  recurrencia_intervalo: number | null;
  recurrencia_dia_semana: number | null;
  recurrencia_dia_mes: number | null;
};

export function recurrenciaDesdeFila(fila: FilaRecurrencia): Recurrencia | null {
  if (fila.recurrencia_frecuencia === "semanal") {
    return {
      frecuencia: "semanal",
      intervalo: fila.recurrencia_intervalo ?? 1,
      diaSemana: fila.recurrencia_dia_semana ?? 0,
    };
  }
  if (fila.recurrencia_frecuencia === "mensual") {
    return {
      frecuencia: "mensual",
      intervalo: fila.recurrencia_intervalo ?? 1,
      diaMes: fila.recurrencia_dia_mes ?? 1,
    };
  }
  return null;
}

export function filaDesdeRecurrencia(
  r: Recurrencia | null | undefined
): FilaRecurrencia {
  if (!r) {
    return {
      recurrencia_frecuencia: null,
      recurrencia_intervalo: 1,
      recurrencia_dia_semana: null,
      recurrencia_dia_mes: null,
    };
  }
  if (r.frecuencia === "semanal") {
    return {
      recurrencia_frecuencia: "semanal",
      recurrencia_intervalo: r.intervalo,
      recurrencia_dia_semana: r.diaSemana,
      recurrencia_dia_mes: null,
    };
  }
  return {
    recurrencia_frecuencia: "mensual",
    recurrencia_intervalo: r.intervalo,
    recurrencia_dia_semana: null,
    recurrencia_dia_mes: r.diaMes,
  };
}
