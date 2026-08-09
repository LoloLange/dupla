import categoriasRaw from "@/data/categorias.json";

type EntradaCategoria = { emoji: string; keywords: string[] };

const DICCIONARIO = categoriasRaw as Record<string, EntradaCategoria>;

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function coincidencia(texto: string, keyword: string): boolean {
  if (keyword.length <= 4) {
    return new RegExp(`(^|\\s)${keyword}(?=\\s|$)`).test(texto);
  }
  return texto.includes(keyword);
}

const ENTRADAS = Object.entries(DICCIONARIO).map(([slug, entrada]) => ({
  slug,
  emoji: entrada.emoji,
  keywords: entrada.keywords.map(normalizar),
}));

function emojiDe(slug: string): string {
  return DICCIONARIO[slug]?.emoji ?? "✨";
}

const EMOJI_POR_CATEGORIA: Record<string, string> = {
  Supermercado: emojiDe("supermercado"),
  "Comida y bares": emojiDe("restaurante"),
  Transporte: emojiDe("viajes_app"),
  Vivienda: emojiDe("vivienda"),
  Servicios: emojiDe("luz"),
  Salud: emojiDe("farmacia"),
  Entretenimiento: emojiDe("cine_teatro"),
  Suscripciones: emojiDe("streaming"),
  Educación: emojiDe("educacion"),
  Otros: "✨",
};

export function emojiDeMovimiento(
  categoria: string,
  descripcion?: string | null,
): string {
  if (descripcion) {
    const texto = normalizar(descripcion);
    let mejor: string | null = null;
    let mejorLen = 0;
    for (const entrada of ENTRADAS) {
      for (const keyword of entrada.keywords) {
        if (keyword.length > mejorLen && coincidencia(texto, keyword)) {
          mejor = entrada.emoji;
          mejorLen = keyword.length;
        }
      }
    }
    if (mejor) return mejor;
  }
  return EMOJI_POR_CATEGORIA[categoria] ?? "✨";
}
