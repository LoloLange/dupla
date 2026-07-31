import { groqChatJson } from "@/lib/groq/client";
import type { GastoParseado } from "@/lib/types";
import { esCategoria } from "@/lib/types";

export const MODELO_PARSE = "llama-3.3-70b-versatile";

const SISTEMA = `
Sos Dupla, la compañera de gastos de una persona argentina que maneja dos monedas: pesos argentinos (ARS) y dólares (USD).

Convertís frases habladas y coloquiales sobre plata en un JSON con esta forma EXACTA:
{
  "tipo": "gasto" | "ingreso",
  "monto": number,
  "moneda": "ARS" | "USD",
  "categoria": string,
  "descripcion": string,
  "fecha": string  // ISO 8601 con hora, ej: "2026-08-06T14:30:00.000Z"
}

Reglas:
- "tipo": "gasto" si es dinero que sale (gasté, pagué, compré, compramos, me cobraron, pagamos, mercado pago me descontó). "ingreso" si es dinero que entra (gané, cobré, recibí, me pagaron, me depositaron, me acreditaron, me llegó, vendí, sueldo, salario, aguinaldo, beca, regalo).
- "monto" SIEMPRE es un número positivo. Nunca strings.
- Si la frase NO contiene un gasto ni un ingreso (saludos, preguntas, agradecimientos, ruido, música), devolvé {"tipo": "gasto", "monto": 0, "categoria": "Otros", "descripcion": ""}. NUNCA inventes un monto.
- Interpretá las monedas: "pesos", "$", "plata", "lucas", "mangos", "8000" -> ARS. "dólares", "usd", "dolares", "verdes", "green", "u$s" -> USD.
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
- "fecha": si la frase dice "hoy", "recién", "ahora" o no da fecha, usá la fecha actual del usuario. Si dice "ayer", restá un día. Si dice "el lunes"/"el martes", calculá el día de la semana correspondiente al día actual de la semana.
- Si la frase tiene incertidumbre o es ambigua, elegí la interpretación más probable y seguí el formato.
- Respondé SOLO el JSON, sin texto alrededor, sin markdown.
`;

export async function parsearTextoATexto(
  texto: string,
  ahora: string
): Promise<GastoParseado | null> {
  const mensajes: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SISTEMA },
    {
      role: "user",
      content: `Ahora son las ${ahora}. Frase del usuario: "${texto}"`,
    },
  ];

  const hayNumero = /\d/.test(texto);

  let resultado = await groqChatJson(mensajes);
  const primero = normalizarGastoParseado(resultado, ahora);
  if (primero) return primero;

  if (!hayNumero) return null;

  console.error(
    "Parseo sin monto pero el texto tiene números. Respuesta cruda:",
    JSON.stringify(resultado)
  );
  mensajes.push({ role: "assistant", content: JSON.stringify(resultado) });
  mensajes.push({
    role: "user",
    content:
      "La frase parece contener un gasto pero no devolviste un monto válido. monto debe ser SOLO un número (ej: 8000, 15.5), sin palabras ni símbolos. Si la frase realmente no tiene un gasto, devolvé monto: 0.",
  });
  resultado = await groqChatJson(mensajes);
  return normalizarGastoParseado(resultado, ahora);
}

function normalizarGastoParseado(
  bruto: unknown,
  ahora: string
): GastoParseado | null {
  if (typeof bruto !== "object" || bruto === null) {
    throw new Error("Formato inesperado del parseo");
  }
  let r = bruto as Record<string, unknown>;
  if (typeof r.gasto === "object" && r.gasto !== null) {
    r = r.gasto as Record<string, unknown>;
  }

  const monto = parsearMonto(r.monto);
  if (monto === null || monto === 0) {
    return null;
  }

  const tipo = r.tipo === "ingreso" ? "ingreso" : "gasto";
  const moneda = r.moneda === "USD" ? "USD" : "ARS";

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

  const fecha = validarFecha(r.fecha, ahora);

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

function validarFecha(valor: unknown, ahora: string): string {
  if (typeof valor !== "string") return new Date(ahora).toISOString();
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return new Date(ahora).toISOString();
  const haceUnAnio = Date.now() - 365 * 24 * 60 * 60 * 1000;
  if (d.getTime() < haceUnAnio) return new Date(ahora).toISOString();
  return d.toISOString();
}
