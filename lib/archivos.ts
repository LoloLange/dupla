import type { Gasto, GastoInput, Moneda, Recurrencia, Tipo } from "@/lib/types";
import { esCategoriaDeTipo, esMoneda } from "@/lib/types";

export type FormatoArchivo = "csv" | "excel";

export type ErrorImportacion = { fila: number; mensaje: string };

export type ResultadoImportacion = {
  datos: GastoInput[];
  errores: ErrorImportacion[];
  totalFilas: number;
  monedasAsumidas: number;
};

type CeldaBruta = string | number | Date | boolean | null | undefined;

export const CAMPOS_VISIBLES = {
  fecha: "Fecha",
  tipo: "Tipo",
  monto: "Monto",
  moneda: "Moneda",
  categoria: "Categoría",
  descripcion: "Descripción",
  tags: "Tags",
  comentario: "Comentario",
  recurrencia: "Recurrencia",
} as const;

export type CampoApp = keyof typeof CAMPOS_VISIBLES;

export const CAMPOS_APP = Object.keys(CAMPOS_VISIBLES) as CampoApp[];

export const CAMPOS_OBLIGATORIOS: CampoApp[] = ["fecha", "monto"];

export const ETIQUETA_CAMPO: Record<CampoApp, string> = { ...CAMPOS_VISIBLES };

export type CampoMapeo = CampoApp | "montoEntrada" | "montoSalida";

export const CAMPOS_MAPEO: CampoMapeo[] = [
  "fecha",
  "tipo",
  "monto",
  "montoEntrada",
  "montoSalida",
  "moneda",
  "categoria",
  "descripcion",
  "tags",
  "comentario",
  "recurrencia",
];

export const ETIQUETA_MAPEO: Record<CampoMapeo, string> = {
  ...CAMPOS_VISIBLES,
  montoEntrada: "Monto (ingresos)",
  montoSalida: "Monto (egresos)",
};

export type ColumnaArchivo = {
  indice: number;
  nombre: string;
  ejemplos: string[];
};

export type HojaArchivo = {
  nombre: string;
  columnas: ColumnaArchivo[];
  filas: CeldaBruta[][];
  filaCabecera: number;
};

export type TipoHoja = "auto" | "ingreso" | "gasto";

export type MapeoHoja = {
  hoja: HojaArchivo;
  tipoHoja: TipoHoja;
  asignacion: Partial<Record<CampoMapeo, number>>;
};

export type AnalisisArchivo = {
  hojas: HojaArchivo[];
};

const ALIASES: Record<CampoApp, string[]> = {
  fecha: [
    "fecha",
    "date and time",
    "data e hora",
    "datetime",
    "transaction date",
    "posted date",
    "fecha y hora",
    "fecha de operacion",
    "fecha operacion",
    "fecha de liquidacion",
    "fecha liquidacion",
    "date",
    "data",
  ],
  tipo: [
    "tipo",
    "tipo de movimiento",
    "tipo de operacion",
    "tipo de transaccion",
    "tipo de pago",
    "type",
    "transaction type",
    "movimiento",
    "transaction",
    "direction",
    "operation",
    "operacion",
    "clasificacion",
  ],
  monto: [
    "monto",
    "importe",
    "cantidad",
    "valor",
    "quantia",
    "amount",
    "sum",
    "value",
    "price",
    "total",
    "paid",
    "monto total",
    "importe total",
  ],
  moneda: ["moneda", "divisa", "moeda", "currency", "amount currency", "mon", "ccy"],
  categoria: [
    "categoria",
    "category",
    "merchant category",
    "rubro",
    "rubrica",
    "clasificacion",
    "cuenta",
  ],
  descripcion: [
    "descripcion",
    "detalle",
    "concepto",
    "descricao",
    "contraparte",
    "description",
    "name",
    "merchant",
    "payee",
    "counterparty",
    "title",
    "narration",
    "titulo",
    "establecimiento",
    "comercio",
    "concept",
    "descripcion del movimiento",
  ],
  tags: ["tags", "tag", "etiquetas", "etiqueta", "labels", "label"],
  comentario: [
    "comentario",
    "nota",
    "observaciones",
    "observacoes",
    "comment",
    "notes",
    "note",
    "memo",
  ],
  recurrencia: ["recurrencia", "frecuencia", "frec", "frequency"],
};

const CAMPOS_VIRTUALES = {
  montoEntrada: [
    "amount in",
    "money in",
    "inflow",
    "income",
    "credit",
    "deposit",
    "top up",
    "topup",
    "ingresos",
    "entrada",
    "entrante",
    "received",
    "money received",
    "dinero recibido",
    "monto recibido",
    "recibido",
    "acreditacion",
    "deposito",
    "ingreso",
  ],
  montoSalida: [
    "amount out",
    "money out",
    "outflow",
    "expense",
    "debit",
    "withdrawal",
    "withdraw",
    "payment",
    "spend",
    "spending",
    "salida",
    "egreso",
    "retiro",
    "dinero enviado",
    "monto enviado",
    "enviado",
    "debito",
  ],
} as const;

type CampoVirtual = keyof typeof CAMPOS_VIRTUALES;

const VALORES_INGRESO = [
  "money received",
  "received",
  "top up",
  "topup",
  "deposit",
  "credit",
  "refund",
  "salary",
  "income",
  "incoming",
  "cashback",
  "interest",
  "reimbursement",
  "gift",
  "transfer received",
  "inflow",
  "money in",
  "ingreso",
  "ingresos",
  "entrada",
  "entradas",
  "credito",
  "creditos",
  "abono",
  "abonos",
  "ganancia",
  "ganancias",
  "receita",
  "receitas",
  "deposito",
  "depositos",
];

const VALORES_GASTO = [
  "card payment",
  "card",
  "payment",
  "debit",
  "withdrawal",
  "withdraw",
  "direct debit",
  "standing order",
  "fee",
  "charge",
  "expense",
  "outgoing",
  "purchase",
  "atm",
  "sent",
  "transfer out",
  "outflow",
  "money out",
  "gasto",
  "gastos",
  "egreso",
  "egresos",
  "salida",
  "salidas",
  "debito",
  "debitos",
  "pago",
  "pagos",
  "consumo",
  "consumos",
  "compra",
  "compras",
  "despesa",
  "despesas",
  "saque",
  "retiro",
  "retiros",
];

const EXCLUYE_INGRESO = [
  "credit card",
  "card credit",
  "tarjeta de credito",
  "credito de impuestos",
];

const REGLAS_CATEGORIA: { claves: string[]; categoria: string }[] = [
  {
    claves: ["grocery", "groceries", "supermarket", "mercado", "supermercado", "almacen"],
    categoria: "Supermercado",
  },
  {
    claves: ["utility", "utilities", "electric", "electricity", "water", "internet", "phone", "mobile", "gas bill", "energy", "telefon", "luz", "agua", "servicios"],
    categoria: "Servicios",
  },
  {
    claves: ["restaurant", "restaurants", "dining", "food", "takeaway", "take out", "takeout", "coffee", "cafe", "lunch", "breakfast", "bar", "delivery", "comida", "restaurante", "bares"],
    categoria: "Comida y bares",
  },
  {
    claves: ["transport", "transit", "car", "fuel", "gasoline", "petrol", "parking", "taxi", "uber", "ride", "toll", "auto", "vehicle", "train", "metro", "gas", "nafta", "gasolina", "transporte"],
    categoria: "Transporte",
  },
  {
    claves: ["rent", "mortgage", "housing", "home", "house", "property", "vivienda", "alquiler", "hipoteca"],
    categoria: "Vivienda",
  },
  {
    claves: ["health", "medical", "pharmacy", "medicine", "doctor", "gym", "fitness", "wellness", "self care", "salud", "farmacia", "medico", "dentist"],
    categoria: "Salud",
  },
  {
    claves: ["entertainment", "movie", "movies", "cinema", "concert", "game", "games", "gaming", "hobby", "hobbies", "leisure", "fun", "cine", "entretenimiento", "party"],
    categoria: "Entretenimiento",
  },
  {
    claves: ["subscription", "subscriptions", "streaming", "membership", "memberships", "netflix", "spotify", "suscripcion"],
    categoria: "Suscripciones",
  },
  {
    claves: ["education", "school", "tuition", "course", "courses", "book", "books", "university", "study", "educacion", "colegio", "curso"],
    categoria: "Educación",
  },
  {
    claves: ["salary", "paycheck", "wage", "wages", "sueldo"],
    categoria: "Sueldo",
  },
  {
    claves: ["freelance", "contract", "independiente"],
    categoria: "Freelance",
  },
  {
    claves: ["sales", "sale", "sell", "ventas"],
    categoria: "Ventas",
  },
  {
    claves: ["investment", "investments", "dividend", "dividends", "interest", "inversion", "inversiones"],
    categoria: "Inversiones",
  },
  {
    claves: ["gift", "gifts", "regalo", "regalos"],
    categoria: "Regalos",
  },
  {
    claves: ["refund", "refunds", "reimburs", "cashback", "reintegro", "reintegros"],
    categoria: "Reintegros",
  },
  {
    claves: ["shopping", "clothing", "clothes", "fashion", "department", "general", "misc", "miscellaneous", "other", "others", "otro", "otros", "compras"],
    categoria: "Otros",
  },
];

function normalizarEncabezado(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function indexarCampo(
  encabezados: string[],
  alias: readonly string[],
  excluir?: Set<number>
): number | undefined {
  let mejor: { largo: number; idx: number; exacto: boolean } | null = null;
  for (const a of alias) {
    for (let i = 0; i < encabezados.length; i++) {
      if (excluir?.has(i)) continue;
      const h = encabezados[i];
      if (h === a) {
        if (mejor === null || a.length > mejor.largo) {
          mejor = { largo: a.length, idx: i, exacto: true };
        }
      } else if (mejor === null || !mejor.exacto) {
        const prefijo =
          h.startsWith(a + " ") || h.startsWith(a + "(") || h.startsWith(a + "-") || h.startsWith(a + ":");
        if (prefijo && (mejor === null || a.length > mejor.largo)) {
          mejor = { largo: a.length, idx: i, exacto: false };
        }
      }
    }
  }
  if (mejor) return mejor.idx;

  let contiene: { largo: number; idx: number } | null = null;
  for (const a of alias) {
    for (let i = 0; i < encabezados.length; i++) {
      const h = encabezados[i];
      if (!h) continue;
      if (new RegExp(`\\b${a}\\b`).test(h) && (contiene === null || a.length > contiene.largo)) {
        contiene = { largo: a.length, idx: i };
      }
    }
  }
  return contiene?.idx;
}

function texto(valor: CeldaBruta): string {
  if (valor == null) return "";
  return String(valor);
}

export function formatoFechaExport(fechaIso: string): string {
  const d = new Date(fechaIso);
  if (Number.isNaN(d.getTime())) return fechaIso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function parsearFechaImport(valor: CeldaBruta): string | null {
  if (valor instanceof Date) {
    return Number.isNaN(+valor) ? null : valor.toISOString();
  }
  if (typeof valor !== "string") return null;
  const v = valor.trim();
  if (!v) return null;

  if (/^\d{4}-\d{2}-\d{2}(?:[T ]\d{1,2}:\d{2}(?::\d{2})?)?$/.test(v)) {
    const iso = v.includes("T") ? v : v.replace(" ", "T");
    const d = new Date(iso.includes(":") ? iso : `${v}T00:00:00`);
    return Number.isNaN(+d) ? null : d.toISOString();
  }

  const m = v.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (m) {
    const [, dStr, moStr, yStr, h, mi, s] = m;
    const dia = +dStr;
    const mes = +moStr;
    const anio = +yStr;
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    const f = new Date(anio, mes - 1, dia, +(h ?? 0), +(mi ?? 0), +(s ?? 0));
    return Number.isNaN(+f) ? null : f.toISOString();
  }

  const d = new Date(v);
  if (!Number.isNaN(+d)) return d.toISOString();

  return null;
}

function parsearMontoImport(valor: CeldaBruta): number | null {
  if (typeof valor === "number") {
    return Number.isFinite(valor) && valor !== 0 ? valor : null;
  }
  if (typeof valor !== "string") return null;

  const v = valor.trim();
  if (!v) return null;
  const negativo = /^\s*-|-\s*$|^\(.*\)$/.test(v);

  const coincidencia = v.match(/[\d.,]+/);
  if (!coincidencia) return null;
  let num = coincidencia[0];

  if (num.includes(",")) {
    const [, decimales] = num.split(",");
    if (decimales.length === 2) {
      num = num.replace(",", ".");
    } else {
      num = num.replace(/,/g, "");
    }
  }
  if (num.includes(".")) {
    const [entera, decimales] = num.split(".");
    if (decimales && decimales.length === 3 && entera.length >= 3) {
      num = num.replace(/\./g, "");
    }
  }

  const n = Number(num);
  if (!Number.isFinite(n) || n === 0) return null;
  return negativo ? -Math.abs(n) : Math.abs(n);
}

function recurrenciaTexto(r: Recurrencia | null): string {
  if (!r) return "";
  return r.frecuencia === "semanal"
    ? `semanal:${r.diaSemana}`
    : `mensual:${r.diaMes}`;
}

function parsearRecurrenciaTexto(valor: string): Recurrencia | null {
  const t = valor.trim().toLowerCase();
  if (!t) return null;
  const sem = t.match(/^semanal(?:[:.-](\d{1,2}))?$/);
  if (sem) {
    return {
      frecuencia: "semanal",
      intervalo: 1,
      diaSemana: sem[1] ? Math.min(6, +sem[1]) : 0,
    };
  }
  const mes = t.match(/^mensual(?:[:.-](\d{1,2}))?$/);
  if (mes) {
    return {
      frecuencia: "mensual",
      intervalo: 1,
      diaMes: mes[1] ? Math.min(31, +mes[1]) : 1,
    };
  }
  return null;
}

const MONEDAS_POR_NOMBRE: { claves: string[]; codigo: Moneda }[] = [
  {
    claves: ["us dollar", "dolar estadounidense", "dolar americano"],
    codigo: "USD",
  },
  { claves: ["euro", "euros"], codigo: "EUR" },
  { claves: ["real brasileno", "reales"], codigo: "BRL" },
  { claves: ["peso chileno"], codigo: "CLP" },
  { claves: ["peso uruguayo"], codigo: "UYU" },
  { claves: ["peso argentino", "pesos"], codigo: "ARS" },
];

function resolverMoneda(valor: CeldaBruta): Moneda | null {
  const crudo = texto(valor).toUpperCase().trim();
  if (esMoneda(crudo)) return crudo as Moneda;
  if (!crudo) return null;

  const sinEspacios = crudo.replace(/\s+/g, "");
  if (/^(US?\$|U\$?S|\$US)/.test(sinEspacios) || sinEspacios.includes("USD"))
    return "USD";
  if (sinEspacios.includes("EUR") || sinEspacios.includes("€")) return "EUR";
  if (sinEspacios.includes("R$") || sinEspacios.includes("BRL")) return "BRL";
  if (sinEspacios.includes("CLP")) return "CLP";
  if (sinEspacios.includes("UYU")) return "UYU";
  if (sinEspacios.includes("$")) return "ARS";

  const t = crudo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  for (const { claves, codigo } of MONEDAS_POR_NOMBRE) {
    if (claves.some((k) => t === k || t.includes(k))) return codigo;
  }
  return null;
}

function mejorColumnaMoneda(
  encabezados: string[],
  filas: CeldaBruta[][],
  inicio = 0
): number | undefined {
  const candidatas: { idx: number; aciertos: number; muestras: number }[] = [];
  for (let i = 0; i < encabezados.length; i++) {
    let aciertos = 0;
    let muestras = 0;
    for (let r = inicio; r < Math.min(filas.length, inicio + 10); r++) {
      const v = filas[r][i];
      const t = texto(v).trim();
      if (!t) continue;
      muestras++;
      if (resolverMoneda(v) !== null) aciertos++;
    }
    if (muestras > 0 && aciertos / muestras >= 0.5) {
      candidatas.push({ idx: i, aciertos, muestras });
    }
  }
  if (candidatas.length === 0) return undefined;
  candidatas.sort(
    (a, b) =>
      b.aciertos / b.muestras - a.aciertos / a.muestras ||
      b.aciertos - a.aciertos
  );
  return candidatas[0].idx;
}

function tipoDesdeValor(v: string): Tipo | null {
  const t = normalizarEncabezado(v);
  if (!t) return null;
  if (
    VALORES_INGRESO.some((x) => t.includes(x)) &&
    !EXCLUYE_INGRESO.some((x) => t.includes(x))
  ) {
    return "ingreso";
  }
  if (VALORES_GASTO.some((x) => t.includes(x))) return "gasto";
  return null;
}

function traducirCategoria(valor: string): string | null {
  const t = normalizarEncabezado(valor);
  if (!t) return null;
  for (const regla of REGLAS_CATEGORIA) {
    if (new RegExp(`\\b(?:${regla.claves.join("|")})\\b`, "i").test(t)) {
      return regla.categoria;
    }
  }
  return null;
}

const PATRON_EGRESO =
  /(^|\W)(salida|salidas|egreso|egresos|gasto|gastos|pago|pagos|retiro|retiros|enviado|enviados|debito|debitos|spend|spent|outflow|outflows|withdrawal|withdraw|withdrawals|payment|payments|debit)(\W|$)/i;
const PATRON_INGRESO =
  /(^|\W)(entrada|entradas|ingreso|ingresos|recibido|recibidos|recibida|cobrado|cobrados|acreditado|acreditados|deposit|deposito|depositos|topup|top up|inflow|inflows|credit|credits|received|salary|sueldo)(\W|$)/i;

function tipoSugeridoPorNombre(nombre: string): Tipo | null {
  const t = normalizarEncabezado(nombre);
  if (!t) return null;
  if (PATRON_EGRESO.test(t)) return "gasto";
  if (PATRON_INGRESO.test(t)) return "ingreso";
  return null;
}

function inferirTipoHoja(nombre: string): TipoHoja {
  const t = normalizarEncabezado(nombre);
  if (!t) return "auto";
  if (
    /(^|\W)(gastos?|egresos?|expenses?|spending|spend|outflows?|salidas?|pagos|payments?|debitos?)(\W|$)/i.test(
      t
    )
  ) {
    return "gasto";
  }
  if (
    /(^|\W)(ingresos?|incomes?|revenues?|ganancias|earnings|inflows?|entradas?|credits?)(\W|$)/i.test(
      t
    )
  ) {
    return "ingreso";
  }
  return "auto";
}

function ejemplosColumna(filas: CeldaBruta[][], idx: number, max: number): string[] {
  const ej: string[] = [];
  for (const f of filas) {
    const v = texto(f[idx]).trim();
    if (!v) continue;
    ej.push(v.length > 24 ? v.slice(0, 24) + "…" : v);
    if (ej.length >= max) break;
  }
  return ej;
}

function indiceVirtuales(
  encabezados: string[]
): Record<CampoVirtual, number | undefined> {
  const r = {} as Record<CampoVirtual, number | undefined>;
  for (const campo of Object.keys(CAMPOS_VIRTUALES) as CampoVirtual[]) {
    r[campo] = indexarCampo(encabezados, CAMPOS_VIRTUALES[campo]);
  }
  return r;
}

function puntajeCabecera(
  encabezados: string[],
  virtuales: Record<CampoVirtual, number | undefined>
): number {
  let score = 0;
  for (const campo of CAMPOS_APP) {
    if (indexarCampo(encabezados, ALIASES[campo]) !== undefined) score++;
  }
  if (virtuales.montoEntrada !== undefined) score++;
  if (virtuales.montoSalida !== undefined) score++;
  return score;
}

function detectarHoja(data: CeldaBruta[][], nombre: string): HojaArchivo {
  if (data.length === 0) {
    return { nombre, columnas: [], filas: [], filaCabecera: 0 };
  }

  let mejorFila = 0;
  let mejorPuntaje = -1;
  const max = Math.min(data.length - 1, 9);
  for (let r = 0; r <= max; r++) {
    const enc = (data[r] ?? []).map((c) => normalizarEncabezado(texto(c)));
    const v = indiceVirtuales(enc);
    const p = puntajeCabecera(enc, v);
    if (p > mejorPuntaje) {
      mejorPuntaje = p;
      mejorFila = r;
    }
  }

  const cabecera = data[mejorFila] ?? [];
  const filas = data
    .slice(mejorFila + 1)
    .filter((f) => f.some((c) => c != null && texto(c).trim() !== ""));

  const columnas = cabecera
    .map((c, idx) => ({
      indice: idx,
      nombre: texto(c).trim(),
      ejemplos: ejemplosColumna(filas, idx, 3),
    }))
    .filter((col) => col.nombre !== "" || col.ejemplos.length > 0);

  return { nombre, columnas, filas, filaCabecera: mejorFila };
}

export async function analizarArchivo(archivo: File): Promise<AnalisisArchivo> {
  if (archivo.name.toLowerCase().endsWith(".csv")) {
    let textoArchivo = await archivo.text();
    if (textoArchivo.charCodeAt(0) === 0xfeff) textoArchivo = textoArchivo.slice(1);
    const base = archivo.name.replace(/\.csv$/i, "") || "CSV";
    return { hojas: [detectarHoja(parsearCsv(textoArchivo), base)] };
  }
  const { default: readXlsxFile } = await import("read-excel-file/browser");
  const hojasCrudas = await readXlsxFile(archivo);
  const hojas = hojasCrudas
    .map((h) => detectarHoja(h.data as CeldaBruta[][], h.sheet))
    .filter((h) => h.columnas.length > 0);
  return { hojas };
}

function valorUsado(
  asignacion: Partial<Record<CampoMapeo, number>>,
  idx: number
): boolean {
  return Object.values(asignacion).some((v) => v === idx);
}

export function asignacionLista(
  asignacion: Partial<Record<CampoMapeo, number>>
): boolean {
  return (
    asignacion.fecha !== undefined &&
    (asignacion.monto !== undefined ||
      asignacion.montoEntrada !== undefined ||
      asignacion.montoSalida !== undefined)
  );
}

export function faltanObligatorios(
  asignacion: Partial<Record<CampoMapeo, number>>
): CampoMapeo[] {
  const faltan: CampoMapeo[] = [];
  if (asignacion.fecha === undefined) faltan.push("fecha");
  if (
    asignacion.monto === undefined &&
    asignacion.montoEntrada === undefined &&
    asignacion.montoSalida === undefined
  ) {
    faltan.push("monto");
  }
  return faltan;
}

export function autoMapear(hoja: HojaArchivo): MapeoHoja {
  const encabezados = hoja.columnas.map((c) => normalizarEncabezado(c.nombre));
  const virtuales = indiceVirtuales(encabezados);

  const excluir = new Set<number>();
  if (virtuales.montoEntrada !== undefined) excluir.add(virtuales.montoEntrada);
  if (virtuales.montoSalida !== undefined) excluir.add(virtuales.montoSalida);

  const candidatos = {} as Record<CampoMapeo, number | undefined>;
  for (const campo of CAMPOS_MAPEO) {
    if (campo === "monto") {
      candidatos.monto = indexarCampo(encabezados, ALIASES.monto, excluir);
    } else if (campo === "montoEntrada") {
      candidatos.montoEntrada = virtuales.montoEntrada;
    } else if (campo === "montoSalida") {
      candidatos.montoSalida = virtuales.montoSalida;
    } else {
      candidatos[campo] = indexarCampo(encabezados, ALIASES[campo]);
    }
  }

  const asignacion: Partial<Record<CampoMapeo, number>> = {};
  for (const campo of CAMPOS_MAPEO) {
    const idx = candidatos[campo];
    if (idx === undefined || valorUsado(asignacion, idx)) continue;
    asignacion[campo] = idx;
  }

  if (asignacion.moneda === undefined) {
    const monedaCol = mejorColumnaMoneda(encabezados, hoja.filas);
    if (monedaCol !== undefined && !valorUsado(asignacion, monedaCol)) {
      asignacion.moneda = monedaCol;
    }
  }

  let tipoHoja: TipoHoja = inferirTipoHoja(hoja.nombre);
  if (tipoHoja === "auto") {
    const soloSalida =
      asignacion.montoSalida !== undefined && asignacion.montoEntrada === undefined;
    const soloEntrada =
      asignacion.montoEntrada !== undefined && asignacion.montoSalida === undefined;
    if (soloSalida) {
      tipoHoja = "gasto";
    } else if (soloEntrada) {
      tipoHoja = "ingreso";
    } else if (asignacion.monto !== undefined) {
      const sugerido = tipoSugeridoPorNombre(
        hoja.columnas[asignacion.monto]?.nombre ?? ""
      );
      if (sugerido) tipoHoja = sugerido;
    }
  }

  return { hoja, tipoHoja, asignacion };
}

function celdaEn(
  mapeo: MapeoHoja,
  campo: CampoMapeo,
  fila: CeldaBruta[]
): CeldaBruta {
  const idx = mapeo.asignacion[campo];
  return idx === undefined ? "" : (fila[idx] ?? "");
}

function filaMapeadaAGasto(
  fila: CeldaBruta[],
  mapeo: MapeoHoja
): { gasto?: GastoInput; error?: string; monedaAsumida?: boolean } {
  const { tipoHoja, asignacion } = mapeo;
  if (!asignacionLista(asignacion)) {
    return { error: "falta mapear Fecha y Monto" };
  }

  const montoUnico = parsearMontoImport(celdaEn(mapeo, "monto", fila));
  const montoEntrada = parsearMontoImport(celdaEn(mapeo, "montoEntrada", fila));
  const montoSalida = parsearMontoImport(celdaEn(mapeo, "montoSalida", fila));

  let tipo: Tipo | null = null;
  let monto: number | null = null;

  const elegirMonto = (t: Tipo): number | null => {
    if (montoUnico !== null) return Math.abs(montoUnico);
    if (t === "ingreso") return montoEntrada ?? montoSalida;
    return montoSalida ?? montoEntrada;
  };

  if (tipoHoja !== "auto") {
    tipo = tipoHoja;
    monto = elegirMonto(tipo);
  } else if (asignacion.tipo !== undefined) {
    const t = tipoDesdeValor(texto(celdaEn(mapeo, "tipo", fila)));
    if (!t) return { error: "tipo inválido" };
    tipo = t;
    monto = elegirMonto(tipo);
  } else if (montoSalida !== null && montoEntrada === null) {
    tipo = "gasto";
    monto = Math.abs(montoSalida);
  } else if (montoEntrada !== null && montoSalida === null) {
    tipo = "ingreso";
    monto = Math.abs(montoEntrada);
  } else if (montoEntrada !== null && montoSalida !== null) {
    tipo = "gasto";
    monto = Math.abs(montoSalida);
  } else if (montoUnico !== null) {
    tipo = montoUnico < 0 ? "gasto" : "ingreso";
    monto = Math.abs(montoUnico);
  }

  if (!tipo || monto === null || monto <= 0) return { error: "monto inválido" };
  monto = Math.abs(monto);

  const fecha = parsearFechaImport(celdaEn(mapeo, "fecha", fila));
  if (!fecha) return { error: "fecha inválida" };

  const monedaResuelta = resolverMoneda(celdaEn(mapeo, "moneda", fila));
  const moneda = monedaResuelta ?? "ARS";

  let categoria = traducirCategoria(texto(celdaEn(mapeo, "categoria", fila))) ?? "";
  if (!categoria || !esCategoriaDeTipo(tipo, categoria)) categoria = "Otros";

  const descripcion = texto(celdaEn(mapeo, "descripcion", fila)).trim();
  const comentario = texto(celdaEn(mapeo, "comentario", fila)).trim();
  const tags = texto(celdaEn(mapeo, "tags", fila))
    .split(/[;,|]/)
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter((t) => t && t.length <= 30)
    .slice(0, 20);
  const recurrencia = parsearRecurrenciaTexto(texto(celdaEn(mapeo, "recurrencia", fila)));

  const gasto: GastoInput = {
    tipo,
    monto,
    moneda,
    categoria,
    descripcion: descripcion || categoria,
    fecha,
    tags,
    ...(comentario ? { comentario } : {}),
    ...(recurrencia ? { recurrencia } : {}),
  };
  return monedaResuelta ? { gasto } : { gasto, monedaAsumida: true };
}

export function construirGastos(
  mapeos: MapeoHoja[],
  limite?: number
): ResultadoImportacion {
  const datos: GastoInput[] = [];
  const errores: ErrorImportacion[] = [];
  let monedasAsumidas = 0;
  let filaGlobal = 1;

  for (const mapeo of mapeos) {
    const { hoja } = mapeo;
    if (!asignacionLista(mapeo.asignacion)) {
      continue;
    }
    const prefijo = hoja.nombre ? `${hoja.nombre}: ` : "";
    for (const fila of hoja.filas) {
      const res = filaMapeadaAGasto(fila, mapeo);
      if (res.gasto) {
        datos.push(res.gasto);
        if (res.monedaAsumida) monedasAsumidas++;
      } else if (res.error) {
        errores.push({ fila: filaGlobal, mensaje: prefijo + res.error });
      }
      filaGlobal++;
      if (limite !== undefined && datos.length + errores.length >= limite) break;
    }
    if (limite !== undefined && datos.length + errores.length >= limite) break;
  }

  return {
    datos,
    errores,
    totalFilas: datos.length + errores.length,
    monedasAsumidas,
  };
}

function escaparCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function parsearCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let enComillas = false;
  let i = 0;
  while (i < texto.length) {
    const ch = texto[i];
    if (enComillas) {
      if (ch === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i += 2;
        } else {
          enComillas = false;
          i += 1;
        }
      } else {
        campo += ch;
        i += 1;
      }
    } else if (ch === '"') {
      enComillas = true;
      i += 1;
    } else if (ch === ",") {
      fila.push(campo);
      campo = "";
      i += 1;
    } else if (ch === "\n") {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
      i += 1;
    } else if (ch === "\r") {
      i += 1;
    } else {
      campo += ch;
      i += 1;
    }
  }
  if (campo !== "" || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas.filter((f) => f.some((c) => c.trim() !== ""));
}

export function gastosACsv(gastos: Gasto[]): string {
  const filas = [CAMPOS_APP.map((c) => escaparCsv(CAMPOS_VISIBLES[c])).join(",")];
  for (const g of gastos) {
    filas.push(
      [
        formatoFechaExport(g.fecha),
        g.tipo,
        String(g.monto),
        g.moneda,
        g.categoria,
        g.descripcion ?? "",
        (g.tags ?? []).join(";"),
        g.comentario ?? "",
        recurrenciaTexto(g.recurrencia),
      ]
        .map(escaparCsv)
        .join(",")
    );
  }
  return filas.join("\r\n");
}

export async function gastosAXlsx(gastos: Gasto[]): Promise<Blob> {
  const writeExcelFile = (await import("write-excel-file/browser")).default;
  const columnas: {
    header: { value: string; fontWeight: "bold" };
    width: number;
    cell: (g: Gasto) => { value: string };
  }[] = [
    {
      header: { value: "Fecha", fontWeight: "bold" },
      width: 16,
      cell: (g) => ({ value: formatoFechaExport(g.fecha) }),
    },
    {
      header: { value: "Tipo", fontWeight: "bold" },
      width: 10,
      cell: (g) => ({ value: g.tipo }),
    },
    {
      header: { value: "Monto", fontWeight: "bold" },
      width: 12,
      cell: (g) => ({ value: String(g.monto) }),
    },
    {
      header: { value: "Moneda", fontWeight: "bold" },
      width: 9,
      cell: (g) => ({ value: g.moneda }),
    },
    {
      header: { value: "Categoría", fontWeight: "bold" },
      width: 20,
      cell: (g) => ({ value: g.categoria }),
    },
    {
      header: { value: "Descripción", fontWeight: "bold" },
      width: 32,
      cell: (g) => ({ value: g.descripcion ?? "" }),
    },
    {
      header: { value: "Tags", fontWeight: "bold" },
      width: 22,
      cell: (g) => ({ value: (g.tags ?? []).join(";") }),
    },
    {
      header: { value: "Comentario", fontWeight: "bold" },
      width: 26,
      cell: (g) => ({ value: g.comentario ?? "" }),
    },
    {
      header: { value: "Recurrencia", fontWeight: "bold" },
      width: 14,
      cell: (g) => ({ value: recurrenciaTexto(g.recurrencia) }),
    },
  ];

  return writeExcelFile(gastos, { columns: columnas }).toBlob();
}
