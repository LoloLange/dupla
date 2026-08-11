export type Moneda = "ARS" | "USD" | "EUR" | "BRL" | "CLP" | "UYU";

export type MonedaSecundaria = Exclude<Moneda, "ARS">;

export const MONEDAS: { codigo: Moneda; etiqueta: string }[] = [
  { codigo: "ARS", etiqueta: "Pesos" },
  { codigo: "USD", etiqueta: "Dólares" },
  { codigo: "EUR", etiqueta: "Euros" },
  { codigo: "BRL", etiqueta: "Reales" },
  { codigo: "CLP", etiqueta: "Pesos chilenos" },
  { codigo: "UYU", etiqueta: "Pesos uruguayos" },
];

export function esMoneda(valor: string): valor is Moneda {
  return MONEDAS.some((m) => m.codigo === valor);
}

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

export const CATEGORIAS_GASTO = [
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

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

export const CATEGORIAS_INGRESO = [
  "Sueldo",
  "Freelance",
  "Ventas",
  "Inversiones",
  "Regalos",
  "Reintegros",
  "Beca",
  "Otros",
] as const;

export type CategoriaIngreso = (typeof CATEGORIAS_INGRESO)[number];

export function esCategoriaGasto(valor: string): valor is CategoriaGasto {
  return (CATEGORIAS_GASTO as readonly string[]).includes(valor);
}

export function esCategoriaIngreso(valor: string): valor is CategoriaIngreso {
  return (CATEGORIAS_INGRESO as readonly string[]).includes(valor);
}

export function esCategoriaDeTipo(tipo: Tipo, valor: string): boolean {
  return tipo === "ingreso"
    ? esCategoriaIngreso(valor)
    : esCategoriaGasto(valor);
}

export function categoriasDeTipo(tipo: Tipo): readonly string[] {
  return tipo === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;
}

export const CATEGORIAS_TODAS: readonly string[] = [
  ...CATEGORIAS_GASTO,
  ...CATEGORIAS_INGRESO.filter(
    (c) => !(CATEGORIAS_GASTO as readonly string[]).includes(c)
  ),
];

export const MONEDAS_SECUNDARIAS: {
  codigo: MonedaSecundaria;
  etiqueta: string;
  plural: string;
  simbolo: string;
}[] = [
  { codigo: "USD", etiqueta: "Dólar", plural: "DÓLARES", simbolo: "U$S" },
  { codigo: "EUR", etiqueta: "Euro", plural: "EUROS", simbolo: "€" },
  { codigo: "BRL", etiqueta: "Real", plural: "REALES", simbolo: "R$" },
  { codigo: "CLP", etiqueta: "Peso chileno", plural: "PESOS CHILENOS", simbolo: "CLP" },
  { codigo: "UYU", etiqueta: "Peso uruguayo", plural: "PESOS URUGUAYOS", simbolo: "UYU" },
];

export function esMonedaSecundaria(valor: string): valor is MonedaSecundaria {
  return MONEDAS_SECUNDARIAS.some((m) => m.codigo === valor);
}

export function infoMonedaSecundaria(
  codigo: MonedaSecundaria
): (typeof MONEDAS_SECUNDARIAS)[number] {
  return MONEDAS_SECUNDARIAS.find((m) => m.codigo === codigo)!;
}
