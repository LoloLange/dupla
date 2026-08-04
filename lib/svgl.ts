export type TemaRoute = { dark: string; light: string };

export type LogoApp = {
  title: string;
  route: string | TemaRoute;
};

type LogoListo = { logo: LogoApp; titulo: string; palabras: string[] };
export type { LogoListo };

const URL_API = "https://api.svgl.app";
const CLAVE_CACHE = "dupla:svgl:v1";
const TTL = 24 * 60 * 60 * 1000;

let cacheMemo: LogoListo[] | null = null;

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function preparar(logos: LogoApp[]): LogoListo[] {
  return logos
    .filter((l) => l.title && l.route)
    .map((l) => {
      const titulo = normalizar(l.title);
      return {
        logo: l,
        titulo,
        palabras: titulo.split(" ").filter((p) => p.length > 2),
      };
    })
    .filter((l) => l.titulo.length >= 3);
}

export async function cargarLogos(): Promise<LogoListo[]> {
  if (cacheMemo) return cacheMemo;
  try {
    const crudo = localStorage.getItem(CLAVE_CACHE);
    if (crudo) {
      const { ts, logos } = JSON.parse(crudo) as {
        ts: number;
        logos: LogoApp[];
      };
      if (Date.now() - ts < TTL) {
        cacheMemo = preparar(logos);
        return cacheMemo;
      }
    }
  } catch {}
  const res = await fetch(URL_API);
  if (!res.ok) throw new Error("No se pudieron cargar los logos");
  const todos = (await res.json()) as LogoApp[];
  cacheMemo = preparar(todos);
  try {
    localStorage.setItem(
      CLAVE_CACHE,
      JSON.stringify({ ts: Date.now(), logos: todos })
    );
  } catch {}
  return cacheMemo;
}

export function rutaLogo(route: string | TemaRoute): string {
  if (typeof route === "string") return route;
  const oscuro =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return oscuro ? (route.dark ?? route.light) : (route.light ?? route.dark);
}

export function buscarLogo(
  texto: string,
  logos: LogoListo[]
): LogoApp | null {
  const desc = normalizar(texto);
  if (!desc) return null;
  const palabras = new Set(desc.split(" ").filter((p) => p.length > 1));

  let mejor: LogoApp | null = null;
  let mejorPuntaje = 0;

  for (const { logo, titulo, palabras: palabrasTitulo } of logos) {
    let puntaje = 0;
    if (desc === titulo) {
      puntaje = 100;
    } else if (desc.includes(titulo)) {
      puntaje = 90;
    } else if (palabras.has(titulo)) {
      puntaje = 85;
    } else if (
      palabrasTitulo.length > 1 &&
      palabrasTitulo.some((p) => palabras.has(p))
    ) {
      puntaje = 70;
    }
    if (puntaje > mejorPuntaje) {
      mejor = logo;
      mejorPuntaje = puntaje;
    }
  }
  return mejor;
}
