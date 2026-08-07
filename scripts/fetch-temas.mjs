#!/usr/bin/env node
// ============================================================
// Dupla · generador de temas (tweakcn-theme-picker)
// ------------------------------------------------------------
// Fetch a cada registry JSON de https://tweakcn-picker.vercel.app/r/theme-<slug>.json,
// extrae el CSS (files[].content), lo limpia y escribe:
//   styles/themes.css        → todos los bloques [data-theme="slug-variante"]
//   lib/temas-data.ts        → metadatos (nombre, categoría, fuente, colores)
//
// Por defecto procesa SOLO el subconjunto de validación.
// Con --all procesa el catálogo completo de 43 temas.
// ============================================================

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const SALIDA_CSS = join(root, "styles", "themes.css");
const SALIDA_TS = join(root, "lib", "temas-data.ts");

export const TEMA_DEFECTO = "solar-dusk-dark";

// Catálogo completo (categorías según tweakcn-theme-picker src/lib/themes-config.ts)
// Nota: el slug de "Windows 98" en el registry es "windows98".
const CATALOGO = [
  { slug: "dupla-clasico", categoria: "minimal" },
  { slug: "default", categoria: "minimal" },
  { slug: "amber-minimal", categoria: "minimal" },
  { slug: "clean-slate", categoria: "minimal" },
  { slug: "elegant-luxury", categoria: "creative" },
  { slug: "mocha-mousse", categoria: "minimal" },
  { slug: "modern-minimal", categoria: "minimal" },
  { slug: "mono", categoria: "minimal" },
  { slug: "bubblegum", categoria: "colorful" },
  { slug: "candyland", categoria: "colorful" },
  { slug: "catppuccin", categoria: "colorful" },
  { slug: "northern-lights", categoria: "colorful" },
  { slug: "ocean-breeze", categoria: "colorful" },
  { slug: "pastel-dreams", categoria: "colorful" },
  { slug: "perpetuity", categoria: "colorful" },
  { slug: "solar-dusk", categoria: "colorful" },
  { slug: "sunset-horizon", categoria: "colorful" },
  { slug: "tangerine", categoria: "colorful" },
  { slug: "nature", categoria: "colorful" },
  { slug: "claude", categoria: "branded" },
  { slug: "vercel", categoria: "branded" },
  { slug: "t3-chat", categoria: "branded" },
  { slug: "twitter", categoria: "branded" },
  { slug: "bold-tech", categoria: "branded" },
  { slug: "supabase", categoria: "branded" },
  { slug: "twitch", categoria: "branded" },
  { slug: "kick", categoria: "branded" },
  { slug: "spotify", categoria: "branded" },
  { slug: "stripe", categoria: "branded" },
  { slug: "github", categoria: "branded" },
  { slug: "cyberpunk", categoria: "creative" },
  { slug: "neo-brutalism", categoria: "creative" },
  { slug: "doom-64", categoria: "creative" },
  { slug: "kodama-grove", categoria: "creative" },
  { slug: "quantum-rose", categoria: "creative" },
  { slug: "claymorphism", categoria: "creative" },
  { slug: "retro-arcade", categoria: "creative" },
  { slug: "vintage-paper", categoria: "creative" },
  { slug: "windows98", categoria: "creative" },
  { slug: "cosmic-night", categoria: "dark" },
  { slug: "midnight-bloom", categoria: "dark" },
  { slug: "graphite", categoria: "dark" },
  { slug: "caffeine", categoria: "dark" },
  { slug: "starry-night", categoria: "dark" },
];

// Subconjunto de validación (cubre las 5 categorías)
const SUBSET = [
  "dupla-clasico",
  "solar-dusk",
  "caffeine",
  "default",
  "catppuccin",
  "cyberpunk",
  "github",
  "vercel",
  "vintage-paper",
  "graphite",
  "amber-minimal",
];

const VARIABLES_KEEP = new Set([
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--destructive-foreground",
  "--border",
  "--input",
  "--ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--radius",
  "--font-sans",
  "--font-serif",
  "--font-mono",
]);

function familiaFuente(valor) {
  const primera = (valor || "").split(",")[0].trim().replace(/['"]/g, "");
  if (
    !primera ||
    /^(system-ui|sans-serif|serif|monospace|ui-sans-serif|ui-serif|ui-monospace|-apple-system|blinkmacsystemfont)$/i.test(
      primera
    )
  ) {
    return null;
  }
  return primera;
}

// Temas locales (no vienen del registry de tweakcn; se definen acá).
// "dupla-clasico" reproduce la dirección de diseño original de Dupla,
// "Río de la Plata" (serif editorial cálida), tal como estaba hardcodeada.
const TEMAS_LOCALES = {
  "dupla-clasico": {
    nombre: "Dupla Clásico",
    bloques: [
      {
        selector: "dupla-clasico-light",
        props: {
          "--background": "#f6efe3",
          "--foreground": "#221a12",
          "--card": "#fffaf1",
          "--card-foreground": "#221a12",
          "--popover": "#fffaf1",
          "--popover-foreground": "#221a12",
          "--primary": "#e06a2f",
          "--primary-foreground": "#ffffff",
          "--secondary": "#efe5d2",
          "--secondary-foreground": "#221a12",
          "--muted": "#efe5d2",
          "--muted-foreground": "#7c6d59",
          "--accent": "#ecddc4",
          "--accent-foreground": "#221a12",
          "--destructive": "#cf4a3a",
          "--destructive-foreground": "#ffffff",
          "--border": "#e5d8c2",
          "--input": "#e5d8c2",
          "--ring": "#c24f1a",
          "--chart-1": "#e06a2f",
          "--chart-2": "#3c6fa8",
          "--chart-3": "#4c9a62",
          "--chart-4": "#c24f1a",
          "--chart-5": "#a99a84",
          "--radius": "0.625rem",
          "--font-sans": '"Instrument Sans", system-ui, sans-serif',
          "--font-serif": '"Fraunces", serif',
          "--font-mono": "ui-monospace, monospace",
        },
      },
      {
        selector: "dupla-clasico-dark",
        props: {
          "--background": "#171310",
          "--foreground": "#f3e9d8",
          "--card": "#201a15",
          "--card-foreground": "#f3e9d8",
          "--popover": "#201a15",
          "--popover-foreground": "#f3e9d8",
          "--primary": "#f2a34d",
          "--primary-foreground": "#171310",
          "--secondary": "#2a231c",
          "--secondary-foreground": "#f3e9d8",
          "--muted": "#2a231c",
          "--muted-foreground": "#a2947f",
          "--accent": "#3a2e20",
          "--accent-foreground": "#f3e9d8",
          "--destructive": "#e5766a",
          "--destructive-foreground": "#171310",
          "--border": "#33291f",
          "--input": "#33291f",
          "--ring": "#ffb45e",
          "--chart-1": "#f2a34d",
          "--chart-2": "#8fb4e8",
          "--chart-3": "#74c68a",
          "--chart-4": "#ffb45e",
          "--chart-5": "#a2947f",
          "--radius": "0.625rem",
          "--font-sans": '"Instrument Sans", system-ui, sans-serif',
          "--font-serif": '"Fraunces", serif',
          "--font-mono": "ui-monospace, monospace",
        },
      },
    ],
  },
};

function parsearBloques(css) {
  const bloques = [];
  const re =
    /\[data-theme=(?:"|')([^"']+)(?:"|')\]\s*\{([\s\S]*?)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const props = {};
    const reProp = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let p;
    while ((p = reProp.exec(m[2])) !== null) {
      props[p[1]] = p[2].trim();
    }
    bloques.push({ selector: m[1], props });
  }
  return bloques;
}

function buscarBloque(bloques, slug, variante) {
  const objetivo = `${slug}-${variante}`;
  const b = bloques.find((x) => x.selector === objetivo);
  return b ?? null;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "dupla-theme-fetcher/1.0" },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function nombreLegible(slug) {
  return slug
    .split("-")
    .map((w) => (w === "64" ? "64" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

async function main() {
  const todos = process.argv.includes("--all");
  const lista = todos ? CATALOGO : CATALOGO.filter((t) => SUBSET.includes(t.slug));

  console.log(
    `Dupla · generando ${lista.length} temas (${todos ? "catálogo completo" : "subconjunto de validación"})…`
  );

  const datos = [];
  const errores = [];

  for (const tema of lista) {
    const temaLocal = TEMAS_LOCALES[tema.slug];
    try {
      let bloques;
      let nombre;
      if (temaLocal) {
        bloques = temaLocal.bloques;
        nombre = temaLocal.nombre;
      } else {
        const url = `https://tweakcn-picker.vercel.app/r/theme-${tema.slug}.json`;
        const json = await fetchJson(url);
        const contenido = json.files?.[0]?.content;
        if (!contenido) throw new Error(`${url} sin files[].content`);
        bloques = parsearBloques(contenido);
        nombre = json.title ?? nombreLegible(tema.slug);
      }

      const variantes = {};
      let radio = null;
      let fuente = null;
      for (const variante of ["dark", "light"]) {
        const bloque = buscarBloque(bloques, tema.slug, variante);
        if (!bloque) throw new Error(`${tema.slug}-${variante} sin bloque CSS`);
        variantes[variante] = {
          fondo: bloque.props["--background"] ?? null,
          primario: bloque.props["--primary"] ?? null,
        };
        if (!radio) radio = bloque.props["--radius"] ?? null;
        if (!fuente) fuente = familiaFuente(bloque.props["--font-sans"]);
      }

      datos.push({
        slug: tema.slug,
        nombre,
        categoria: tema.categoria,
        fuente,
        colores: variantes,
        bloques,
      });
      console.log(`  ✓ ${tema.slug} (${nombre})`);
    } catch (e) {
      errores.push(String(e.message ?? e));
      console.error(`  ✗ ${tema.slug} → ${e.message ?? e}`);
    }
  }

  if (datos.length === 0) {
    console.error("No se pudo generar ningún tema. Abortando.");
    process.exit(1);
  }
  if (errores.length > 0) {
    console.error(`\n${errores.length} tema(s) fallaron:`);
    for (const e of errores) console.error(`  - ${e}`);
  }

  // ---------- themes.css ----------
  mkdirSync(dirname(SALIDA_CSS), { recursive: true });
  const partes = [];
  partes.push(
    `/* ============================================================
   Dupla · temas (tweakcn-theme-picker)
   GENERADO por scripts/fetch-temas.mjs — no editar a mano.
   Re-generar con: node scripts/fetch-temas.mjs [--all]
   ============================================================ */\n`
  );

  // Fallback: el tema por defecto también en :root para pre-hidratación
  const defecto = datos.find((d) => `${d.slug}-dark` === TEMA_DEFECTO);
  if (defecto) {
    const cssDark = cssBloque(defecto, "dark");
    if (cssDark) {
      partes.push(`/* Fallback (tema por defecto) */\n:root {\n${cssDark}\n}\n\n`);
    }
  }

  for (const tema of datos) {
    for (const variante of ["light", "dark"]) {
      const bloque = cssBloque(tema, variante);
      if (bloque) {
        partes.push(`[data-theme="${tema.slug}-${variante}"] {\n${bloque}\n}\n`);
      }
    }
  }
  writeFileSync(SALIDA_CSS, partes.join("\n"));
  console.log(`\n✓ styles/themes.css (${datos.length} temas)`);

  // ---------- lib/temas-data.ts ----------
  const filas = datos.map((d) => ({
    slug: d.slug,
    nombre: d.nombre,
    categoria: d.categoria,
    fuente: d.fuente,
    colores: {
      light: { fondo: d.colores.light.fondo, primario: d.colores.light.primario },
      dark: { fondo: d.colores.dark.fondo, primario: d.colores.dark.primario },
    },
  }));

  const ts = `// ============================================================
// Dupla · datos de temas
// GENERADO por scripts/fetch-temas.mjs — no editar a mano.
// Re-generar con: node scripts/fetch-temas.mjs [--all]
// ============================================================

export type VarianteTema = "light" | "dark";
export type CategoriaTema = "minimal" | "colorful" | "branded" | "creative" | "dark";

export type TemaInfo = {
  slug: string;
  nombre: string;
  categoria: CategoriaTema;
  fuente: string | null;
  colores: Record<VarianteTema, { fondo: string | null; primario: string | null }>;
};

export const TEMA_DEFECTO = ${JSON.stringify(TEMA_DEFECTO)};

export const ETIQUETAS_CATEGORIA: Record<CategoriaTema, string> = {
  minimal: "Minimal",
  colorful: "Colorful",
  branded: "Branded",
  creative: "Creative",
  dark: "Dark",
};

export const TEMAS: TemaInfo[] = ${JSON.stringify(filas, null, 2)};

export function temaPorSlug(slug: string | null | undefined): TemaInfo | null {
  if (!slug) return null;
  return TEMAS.find((t) => t.slug === slug) ?? null;
}

export function validarTema(tema: string | null | undefined): string {
  if (!tema) return TEMA_DEFECTO;
  const m = tema.match(/^(.*)-(light|dark)$/);
  if (!m) return TEMA_DEFECTO;
  const slug = m[1];
  const variante = m[2];
  const conocido = TEMAS.some((t) => t.slug === slug);
  if (!conocido) return TEMA_DEFECTO;
  return \`\${slug}-\${variante}\`;
}
`;

  writeFileSync(SALIDA_TS, ts);
  console.log(`✓ lib/temas-data.ts`);
  console.log(`\nListo. ${datos.length} temas.`);
}

function cssBloque(tema, variante) {
  const bloque = tema.bloques.find((x) => x.selector === `${tema.slug}-${variante}`);
  if (!bloque) return null;
  return Object.entries(bloque.props)
    .filter(([k]) => VARIABLES_KEEP.has(k))
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
