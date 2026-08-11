import { groqChatJson } from "@/lib/groq/client";
import type { GastoParseado } from "@/lib/types";
import { esCategoria, esMoneda } from "@/lib/types";

export const MODELO_PARSE = "llama-3.3-70b-versatile";

const SISTEMA = `
Sos Dupla, la compañera de gastos de una persona argentina que maneja varias monedas: pesos argentinos (ARS), dólares (USD), euros (EUR), reales (BRL), pesos chilenos (CLP) y pesos uruguayos (UYU). Cada movimiento se anota en la moneda en la que se hizo, sin convertirlo.

Convertís frases habladas y coloquiales sobre plata en un JSON con esta forma EXACTA:
{
  "movimientos": [
    {
      "tipo": "gasto" | "ingreso",
      "monto": number,
      "moneda": "ARS" | "USD" | "EUR" | "BRL" | "CLP" | "UYU",
      "categoria": string,
      "descripcion": string,
      "fecha": string,  // fecha y hora LOCAL del usuario, SIN zona horaria, ej: "2026-08-06T14:30:00"
      "fecha_hint": string  // parte de la frase que indica la fecha de ESTE movimiento, ej: "el 3 de agosto", "ayer", "hoy a las 9 de la noche", "a la una del mediodia", o "" si no hay
    }
  ]
}

Reglas:
- Si la frase menciona DOS O MÁS gastos o ingresos (ej: "gasté 8 mil en el súper y 5 mil en el cine", "compré pan y un helado", "cobré el sueldo y pagué el alquiler"), devolvé UN objeto en "movimientos" por cada uno, separados y completos. NUNCA combines montos ni descripciones con "y" ni los sumes en un solo movimiento.
- Si un solo movimiento tiene varios montos (ej: "gasté 8 mil en el súper y 5 mil en el cine"), cada monto va en su propio movimiento.
- "tipo": "gasto" si es dinero que sale (gasté, pagué, compré, compramos, me cobraron, pagamos, mercado pago me descontó). "ingreso" si es dinero que entra (gané, cobré, recibí, me pagaron, me depositaron, me acreditaron, me llegó, vendí, sueldo, salario, aguinaldo, beca, regalo).
- "monto" SIEMPRE es un número positivo. Nunca strings.
- Si la frase menciona un gasto o un ingreso pero NO dice ningún monto (ej: "compré pan", "pagué el alquiler", "me llegó la beca"), poné "monto": null y completá igual "descripcion" y "categoria". NUNCA inventes un monto.
- Si la frase NO contiene un gasto ni un ingreso (saludos, preguntas, agradecimientos, ruido, música), devolvé {"movimientos": []}. NUNCA inventes un monto.
- Interpretá las monedas: "pesos", "$", "plata", "lucas", "mangos", "8000" -> ARS. "dólares", "usd", "dolares", "verdes", "green", "u$s" -> USD.
- "peso" SIN más contexto SIEMPRE es el argentino (ARS): "1000 pesos" -> 1000 ARS. "peso chileno" o "peso uruguayo" SOLO si la frase lo dice completo (ej: "20 mil pesos chilenos" -> CLP, "500 pesos uruguayos" -> UYU).
- Podés reconocer otras monedas si la frase las nombra: "euros", "euro" -> EUR; "reales", "real" (moneda de Brasil) -> BRL; "pesos chilenos", "lucas chilenas", "CLP" -> CLP; "pesos uruguayos", "UYU" -> UYU.
- NUNCA conviertas entre monedas: cada movimiento se anota en su moneda original, con su monto original y sin aclaraciones entre paréntesis. Ej: "gasté 50 euros en Roma" -> {"monto": 50, "moneda": "EUR", "descripcion": "Café en Roma"}.
- "mil" = 1000, "lucas" = mil, "palos" = millón. "8 mil" = 8000, "dos mil quinientos" = 2500, "15 dolares" = 15 USD.
- Elegí la categoría más cercana de esta lista fija: Supermercado, Comida y bares, Transporte, Vivienda, Servicios, Salud, Entretenimiento, Suscripciones, Educación, Otros.
  - Supermercado: supermercado, chino, almacén, kiosco, verdulería, fiambrería, carnicería, coto, carrefour, jumbo.
  - Comida y bares: restaurante, delivery, cafetería, bar, hamburguesas, pizza, helado, pedidos ya, rappi.
  - Suscripciones: netflix, spotify, disney, prime, youtube, max, hbo, stream, streaming, iCloud, google one.
  - Servicios: luz, gas, agua, internet, celular, telefono, expensas, wifi, fibra, cable.
  - Entretenimiento: cine, concierto, recital, boliche, teatro, juegos, gaming.
  - Salud: farmacia, médico, odontólogo, remedio, medicamento, obra social, psicólogo.
  - Transporte: taxi, uber, cabify, didi, bondi, colectivo, subte, tren, remís, nafta, combustible, estacionamiento.
  - Educación: curso, libro, facultad, colegio, idioma, suscripción educativa.
  - Vivienda: alquiler, seguro, muebles, hogar, arreglos, bazar.
- "descripcion": texto corto y natural para mostrar, ej "Supermercado Coto" o "Netflix". Sin signos raros.
- "fecha": es la hora LOCAL del usuario y SIEMPRE sin zona horaria (ej: "2026-08-07T21:00:00"). NUNCA uses "Z" ni "+00:00" ni "-03:00". La hora local actual te la paso abajo. Si la frase dice "hoy", "recién", "ahora" o no da fecha, usá la fecha local actual. Si dice "ayer", restá un día. Si dice "el lunes"/"el martes", calculá el día de la semana correspondiente al día actual de la semana. Si la frase dice una hora ("a las 9 de la noche", "a la mañana", "al mediodía"), reflejá esa hora tal cual en el campo "fecha" (21:00, 09:00, 12:00 respectivamente).
- "fecha_hint": copiá TEXTUALMENTE la parte de la frase que indica la fecha y hora de ESTE movimiento en particular. Si hay varios movimientos, cada uno lleva SOLO el fragmento que le corresponde a él (ej: para "el 3 de agosto gasté 30 mil y ayer gasté 10 dólares" el primero lleva "el 3 de agosto" y el segundo "ayer"). Si ese movimiento no tiene fecha, poné "".
- Si la frase tiene incertidumbre o es ambigua, elegí la interpretación más probable y seguí el formato.
- Respondé SOLO el JSON, sin texto alrededor, sin markdown.
`;

export async function parsearTextoATexto(
  texto: string,
  ahoraLocal: string,
  offsetMinutos: number
): Promise<GastoParseado[]> {
  const mensajes: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SISTEMA },
    {
      role: "user",
      content: `Ahora son las ${ahoraLocal} (hora local del usuario, sin zona horaria). Devolvé "fecha" en esa misma hora local, sin "Z" ni offsets. Frase del usuario: "${texto}"`,
    },
  ];

  const hayNumero = /\d/.test(texto);

  let resultado = await groqChatJson(mensajes);
  const movimientos = normalizarMovimientos(resultado, texto, ahoraLocal, offsetMinutos);
  if (movimientos.length > 0) return movimientos;

  if (!hayNumero) return [];

  console.error(
    "Parseo sin movimientos pero el texto tiene números. Respuesta cruda:",
    JSON.stringify(resultado)
  );
  mensajes.push({ role: "assistant", content: JSON.stringify(resultado) });
  mensajes.push({
    role: "user",
    content:
      "La frase parece contener gastos o ingresos pero no devolviste montos válidos. monto debe ser SOLO un número (ej: 8000, 15.5), sin palabras ni símbolos. Si la frase realmente no tiene movimientos, devolvé {\"movimientos\": []}.",
  });
  resultado = await groqChatJson(mensajes);
  return normalizarMovimientos(resultado, texto, ahoraLocal, offsetMinutos);
}

function normalizarMovimientos(
  bruto: unknown,
  texto: string,
  ahoraLocal: string,
  offsetMinutos: number
): GastoParseado[] {
  if (typeof bruto !== "object" || bruto === null) {
    throw new Error("Formato inesperado del parseo");
  }
  let lista: unknown[];
  const r = bruto as Record<string, unknown>;
  if (Array.isArray(bruto)) lista = bruto;
  else if (Array.isArray(r.movimientos)) lista = r.movimientos;
  else if (r.gasto) lista = [r.gasto];
  else lista = [r];

  const resultado: GastoParseado[] = [];
  const unico = lista.length === 1;
  for (const item of lista) {
    const g = normalizarUno(item, texto, unico, ahoraLocal, offsetMinutos);
    if (g) resultado.push(g);
  }
  return resultado;
}

function normalizarUno(
  bruto: unknown,
  texto: string,
  unico: boolean,
  ahoraLocal: string,
  offsetMinutos: number
): GastoParseado | null {
  if (typeof bruto !== "object" || bruto === null) {
    return null;
  }
  let r = bruto as Record<string, unknown>;
  if (typeof r.gasto === "object" && r.gasto !== null) {
    r = r.gasto as Record<string, unknown>;
  }

  const monto = parsearMonto(r.monto);

  const tipo = r.tipo === "ingreso" ? "ingreso" : "gasto";
  const monedaRaw = typeof r.moneda === "string" ? r.moneda : "";
  const moneda = esMoneda(monedaRaw) ? monedaRaw : "ARS";

  let categoria = typeof r.categoria === "string" ? r.categoria.trim() : "Otros";
  if (!esCategoria(categoria)) {
    const coincidencia = CATEGORIAS_POSIBLES.find((c) =>
      categoria.toLowerCase().includes(c.toLowerCase())
    );
    categoria = coincidencia ?? "Otros";
  }

  let descripcion =
    typeof r.descripcion === "string" ? r.descripcion.trim() : "";
  if (!descripcion) descripcion = categoria;

  const hint =
    typeof r.fecha_hint === "string" && r.fecha_hint.trim()
      ? r.fecha_hint.trim()
      : "";
  const textoFecha = hint || (unico ? texto : "");
  const fecha = resolverFecha(textoFecha, r.fecha, ahoraLocal, offsetMinutos);

  return { tipo, monto, moneda, categoria, descripcion, fecha };
}

const CATEGORIAS_POSIBLES = [
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
];

function parsearMonto(valor: unknown): number | null {
  if (typeof valor === "number") {
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  }
  if (typeof valor !== "string") return null;

  const coincidencia = valor.match(/\d[\d.,]*/);
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
  return Number.isFinite(n) && n > 0 ? n : null;
}

function aIsoDesdeHoraLocal(
  fechaLocal: string,
  offsetMinutos: number
): string | null {
  const m = fechaLocal
    .trim()
    .match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?/
    );
  if (!m) return null;
  const [, y, mo, d, h = "0", mi = "0", s = "0"] = m;
  const utcCandidato = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  if (Number.isNaN(utcCandidato)) return null;
  return new Date(utcCandidato + offsetMinutos * 60000).toISOString();
}

const DIAS_SEMANA: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const MESES: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

function textoNormalizado(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function aStrFecha(y: number, mo: number, d: number): string {
  return `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function diaReferencia(texto: string, ahoraLocal: string): string | null {
  const t = textoNormalizado(texto);
  const fechaParte = ahoraLocal.split("T")[0];
  const [y, mo, d] = fechaParte.split("-").map(Number);
  const hoy = Date.UTC(y, mo - 1, d);

  const porDias = (n: number): string => {
    const base = new Date(hoy + n * 86_400_000);
    return aStrFecha(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate());
  };

  if (/\banteayer\b/.test(t)) return porDias(-2);
  if (/\banoche\b/.test(t)) return porDias(-1);
  if (/\bayer\b/.test(t)) return porDias(-1);
  if (/\b(?:hoy|recien|recien ahora|ahora mismo)\b/.test(t)) return porDias(0);

  for (const nombreDia of Object.keys(DIAS_SEMANA)) {
    if (!new RegExp(`\\b${nombreDia}\\b`).test(t)) continue;
    const objetivo = DIAS_SEMANA[nombreDia];
    const diaHoy = new Date(hoy).getUTCDay();
    let diff = diaHoy - objetivo;
    if (diff < 0) diff += 7;
    return porDias(-diff);
  }

  const reMes = /\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/;
  const mMes = reMes.exec(t);
  if (mMes) {
    const [, diaTexto, mesTexto] = mMes;
    if (diaTexto && mesTexto) {
      const dia = Math.min(31, Math.max(1, +diaTexto));
      return aStrFecha(y, MESES[mesTexto], dia);
    }
  }

  const reNum = /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/;
  const mNum = reNum.exec(t);
  if (mNum) {
    const [, diaTexto, mesTexto, anioTexto] = mNum;
    if (diaTexto && mesTexto) {
      const dia = +diaTexto;
      const mes = +mesTexto;
      if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
        const anio = anioTexto
          ? +anioTexto < 100
            ? 2000 + +anioTexto
            : +anioTexto
          : y;
        return aStrFecha(anio, mes - 1, dia);
      }
    }
  }

  return null;
}

function resolverFecha(
  texto: string,
  fechaLlm: unknown,
  ahoraLocal: string,
  offsetMinutos: number
): string {
  const dia = diaReferencia(texto, ahoraLocal);
  const fechaLlmStr = typeof fechaLlm === "string" ? fechaLlm : "";
  if (!dia) return validarFecha(fechaLlmStr, ahoraLocal, offsetMinutos);

  const reHora = /(\d{1,2}):(\d{2})(?::(\d{2}))?/;
  const mHora = reHora.exec(fechaLlmStr);
  let horaCompleta: string;
  if (mHora) {
    const [, h, mi, s] = mHora;
    horaCompleta = `${(h ?? "0").padStart(2, "0")}:${(mi ?? "00")}:${s ?? "00"}`;
  } else {
    horaCompleta = ahoraLocal.split("T")[1] ?? "12:00:00";
  }
  return validarFecha(`${dia}T${horaCompleta}`, ahoraLocal, offsetMinutos);
}

function validarFecha(
  valor: unknown,
  ahoraLocal: string,
  offsetMinutos: number
): string {
  const ahoraUtc =
    aIsoDesdeHoraLocal(ahoraLocal, offsetMinutos) ?? new Date().toISOString();
  const haceUnAnio = Date.now() - 365 * 24 * 60 * 60 * 1000;

  if (typeof valor === "string" && valor.trim()) {
    const v = valor.trim();
    const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(v);
    if (tieneZona) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime()) && d.getTime() >= haceUnAnio) {
        return d.toISOString();
      }
    } else {
      const conv = aIsoDesdeHoraLocal(v, offsetMinutos);
      if (conv && new Date(conv).getTime() >= haceUnAnio) {
        return conv;
      }
    }
  }
  return ahoraUtc;
}
