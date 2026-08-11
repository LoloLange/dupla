export type Moneda = "ARS" | "USD";

export type Tipo = "gasto" | "ingreso";

export type RecurrenciaFrecuencia = "semanal" | "mensual";

export type Recurrencia =
  | { frecuencia: "semanal"; intervalo: number; diaSemana: number }
  | { frecuencia: "mensual"; intervalo: number; diaMes: number };

export type Gasto = {
  id: string;
  user_id: string;
  monto: number;
  moneda: Moneda;
  tipo: Tipo;
  categoria: string;
  descripcion: string | null;
  fecha: string;
  created_at: string;
  recurrencia: Recurrencia | null;
  tags: string[];
  comentario: string | null;
};

export type GastoInput = {
  monto: number;
  moneda: Moneda;
  tipo: Tipo;
  categoria: string;
  descripcion: string;
  fecha: string;
  recurrencia?: Recurrencia | null;
  tags?: string[];
  comentario?: string;
};

export type GastoParseado = Omit<GastoInput, "monto"> & {
  monto: number | null;
};

export const CATEGORIAS = [
  "Supermercado",
  "Comida y bares",
  "Transporte",
  "Vivienda",
  "Servicios",
  "Salud",
  "Entretenimiento",
  "Suscripciones",
  "Educación",
  "Otros",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export function esCategoria(valor: string): valor is Categoria {
  return (CATEGORIAS as readonly string[]).includes(valor);
}
