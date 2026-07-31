export type Moneda = "ARS" | "USD";

export type Tipo = "gasto" | "ingreso";

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
};

export type GastoInput = {
  monto: number;
  moneda: Moneda;
  tipo: Tipo;
  categoria: string;
  descripcion: string;
  fecha: string;
};

export type GastoParseado = GastoInput & {
  monto: number;
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
