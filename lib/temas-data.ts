// ============================================================
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

export const TEMA_DEFECTO = "solar-dusk-dark";

export const ETIQUETAS_CATEGORIA: Record<CategoriaTema, string> = {
  minimal: "Minimal",
  colorful: "Colorful",
  branded: "Branded",
  creative: "Creative",
  dark: "Dark",
};

export const TEMAS: TemaInfo[] = [
  {
    "slug": "dupla-clasico",
    "nombre": "Dupla Clásico",
    "categoria": "minimal",
    "fuente": "Instrument Sans",
    "colores": {
      "light": {
        "fondo": "#f6efe3",
        "primario": "#e06a2f"
      },
      "dark": {
        "fondo": "#171310",
        "primario": "#f2a34d"
      }
    }
  },
  {
    "slug": "default",
    "nombre": "Default",
    "categoria": "minimal",
    "fuente": null,
    "colores": {
      "light": {
        "fondo": "oklch(1 0 0)",
        "primario": "oklch(0.2050 0 0)"
      },
      "dark": {
        "fondo": "oklch(0.1450 0 0)",
        "primario": "oklch(0.9220 0 0)"
      }
    }
  },
  {
    "slug": "amber-minimal",
    "nombre": "Amber Minimal",
    "categoria": "minimal",
    "fuente": "Inter",
    "colores": {
      "light": {
        "fondo": "oklch(1 0 0)",
        "primario": "oklch(0.77 0.16 70.08)"
      },
      "dark": {
        "fondo": "oklch(0.2 0 0)",
        "primario": "oklch(0.77 0.16 70.08)"
      }
    }
  },
  {
    "slug": "clean-slate",
    "nombre": "Clean Slate",
    "categoria": "minimal",
    "fuente": "Inter",
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0 247.86)",
        "primario": "oklch(0.59 0.2 277.12)"
      },
      "dark": {
        "fondo": "oklch(0.21 0.04 265.75)",
        "primario": "oklch(0.68 0.16 276.93)"
      }
    }
  },
  {
    "slug": "elegant-luxury",
    "nombre": "Elegant Luxury",
    "categoria": "creative",
    "fuente": "Poppins",
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0 56.38)",
        "primario": "oklch(0.47 0.15 24.94)"
      },
      "dark": {
        "fondo": "oklch(0.22 0.01 56.04)",
        "primario": "oklch(0.51 0.19 27.52)"
      }
    }
  },
  {
    "slug": "mocha-mousse",
    "nombre": "Mocha Mousse",
    "categoria": "minimal",
    "fuente": "DM Sans",
    "colores": {
      "light": {
        "fondo": "oklch(0.95 0.01 102.46)",
        "primario": "oklch(0.61 0.06 44.36)"
      },
      "dark": {
        "fondo": "oklch(0.27 0.01 48.18)",
        "primario": "oklch(0.73 0.05 52.33)"
      }
    }
  },
  {
    "slug": "modern-minimal",
    "nombre": "Modern Minimal",
    "categoria": "minimal",
    "fuente": "Inter",
    "colores": {
      "light": {
        "fondo": "oklch(1 0 0)",
        "primario": "oklch(0.62 0.19 259.81)"
      },
      "dark": {
        "fondo": "oklch(0.2 0 0)",
        "primario": "oklch(0.62 0.19 259.81)"
      }
    }
  },
  {
    "slug": "mono",
    "nombre": "Mono",
    "categoria": "minimal",
    "fuente": "Geist Mono",
    "colores": {
      "light": {
        "fondo": "oklch(1 0 0)",
        "primario": "oklch(0.56 0 0)"
      },
      "dark": {
        "fondo": "oklch(0.14 0 0)",
        "primario": "oklch(0.56 0 0)"
      }
    }
  },
  {
    "slug": "bubblegum",
    "nombre": "Bubblegum",
    "categoria": "colorful",
    "fuente": "Poppins",
    "colores": {
      "light": {
        "fondo": "oklch(0.94 0.02 345.7)",
        "primario": "oklch(0.62 0.18 348.14)"
      },
      "dark": {
        "fondo": "oklch(0.25 0.03 234.16)",
        "primario": "oklch(0.92 0.08 87.67)"
      }
    }
  },
  {
    "slug": "candyland",
    "nombre": "Candyland",
    "categoria": "colorful",
    "fuente": "Poppins",
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0 228.78)",
        "primario": "oklch(0.87 0.07 7.09)"
      },
      "dark": {
        "fondo": "oklch(0.23 0.01 264.29)",
        "primario": "oklch(0.8 0.14 349.23)"
      }
    }
  },
  {
    "slug": "catppuccin",
    "nombre": "Catppuccin",
    "categoria": "colorful",
    "fuente": "Montserrat",
    "colores": {
      "light": {
        "fondo": "oklch(0.96 0.01 264.53)",
        "primario": "oklch(0.55 0.25 297.02)"
      },
      "dark": {
        "fondo": "oklch(0.22 0.03 284.06)",
        "primario": "oklch(0.79 0.12 304.77)"
      }
    }
  },
  {
    "slug": "northern-lights",
    "nombre": "Northern Lights",
    "categoria": "colorful",
    "fuente": "Plus Jakarta Sans",
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0 286.38)",
        "primario": "oklch(0.65 0.15 150.31)"
      },
      "dark": {
        "fondo": "oklch(0.23 0.01 264.29)",
        "primario": "oklch(0.65 0.15 150.31)"
      }
    }
  },
  {
    "slug": "ocean-breeze",
    "nombre": "Ocean Breeze",
    "categoria": "colorful",
    "fuente": "DM Sans",
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0.01 244.25)",
        "primario": "oklch(0.72 0.19 149.58)"
      },
      "dark": {
        "fondo": "oklch(0.21 0.04 265.75)",
        "primario": "oklch(0.77 0.15 163.22)"
      }
    }
  },
  {
    "slug": "pastel-dreams",
    "nombre": "Pastel Dreams",
    "categoria": "colorful",
    "fuente": "Open Sans",
    "colores": {
      "light": {
        "fondo": "oklch(0.97 0.01 314.78)",
        "primario": "oklch(0.71 0.16 293.54)"
      },
      "dark": {
        "fondo": "oklch(0.22 0.01 56.04)",
        "primario": "oklch(0.79 0.12 295.75)"
      }
    }
  },
  {
    "slug": "perpetuity",
    "nombre": "Perpetuity",
    "categoria": "colorful",
    "fuente": "Source Code Pro",
    "colores": {
      "light": {
        "fondo": "oklch(0.95 0.01 197.01)",
        "primario": "oklch(0.56 0.09 203.28)"
      },
      "dark": {
        "fondo": "oklch(0.21 0.02 224.45)",
        "primario": "oklch(0.85 0.13 195.04)"
      }
    }
  },
  {
    "slug": "solar-dusk",
    "nombre": "Solar Dusk",
    "categoria": "colorful",
    "fuente": "Oxanium",
    "colores": {
      "light": {
        "fondo": "oklch(0.99 0.01 84.57)",
        "primario": "oklch(0.56 0.15 49)"
      },
      "dark": {
        "fondo": "oklch(0.22 0.01 56.04)",
        "primario": "oklch(0.7 0.19 47.6)"
      }
    }
  },
  {
    "slug": "sunset-horizon",
    "nombre": "Sunset Horizon",
    "categoria": "colorful",
    "fuente": "Montserrat",
    "colores": {
      "light": {
        "fondo": "oklch(0.99 0.01 56.32)",
        "primario": "oklch(0.74 0.16 34.71)"
      },
      "dark": {
        "fondo": "oklch(0.26 0.02 352.4)",
        "primario": "oklch(0.74 0.16 34.71)"
      }
    }
  },
  {
    "slug": "tangerine",
    "nombre": "Tangerine",
    "categoria": "colorful",
    "fuente": "Inter",
    "colores": {
      "light": {
        "fondo": "oklch(0.94 0 236.5)",
        "primario": "oklch(0.64 0.17 36.44)"
      },
      "dark": {
        "fondo": "oklch(0.26 0.03 262.67)",
        "primario": "oklch(0.64 0.17 36.44)"
      }
    }
  },
  {
    "slug": "nature",
    "nombre": "Nature",
    "categoria": "colorful",
    "fuente": "Montserrat",
    "colores": {
      "light": {
        "fondo": "oklch(0.97 0.01 80.72)",
        "primario": "oklch(0.52 0.13 144.17)"
      },
      "dark": {
        "fondo": "oklch(0.27 0.03 150.77)",
        "primario": "oklch(0.67 0.16 144.21)"
      }
    }
  },
  {
    "slug": "claude",
    "nombre": "Claude",
    "categoria": "branded",
    "fuente": null,
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0.01 95.1)",
        "primario": "oklch(0.62 0.14 39.04)"
      },
      "dark": {
        "fondo": "oklch(0.27 0 106.64)",
        "primario": "oklch(0.67 0.13 38.76)"
      }
    }
  },
  {
    "slug": "vercel",
    "nombre": "Vercel",
    "categoria": "branded",
    "fuente": "Geist",
    "colores": {
      "light": {
        "fondo": "oklch(0.99 0 0)",
        "primario": "oklch(0 0 0)"
      },
      "dark": {
        "fondo": "oklch(0 0 0)",
        "primario": "oklch(1 0 0)"
      }
    }
  },
  {
    "slug": "t3-chat",
    "nombre": "T3 Chat",
    "categoria": "branded",
    "fuente": null,
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0.01 325.64)",
        "primario": "oklch(0.53 0.14 355.2)"
      },
      "dark": {
        "fondo": "oklch(0.24 0.02 307.53)",
        "primario": "oklch(0.46 0.19 4.1)"
      }
    }
  },
  {
    "slug": "twitter",
    "nombre": "Twitter",
    "categoria": "branded",
    "fuente": "Open Sans",
    "colores": {
      "light": {
        "fondo": "oklch(1 0 0)",
        "primario": "oklch(0.67 0.16 245)"
      },
      "dark": {
        "fondo": "oklch(0 0 0)",
        "primario": "oklch(0.67 0.16 245.01)"
      }
    }
  },
  {
    "slug": "bold-tech",
    "nombre": "Bold Tech",
    "categoria": "branded",
    "fuente": "Roboto",
    "colores": {
      "light": {
        "fondo": "oklch(1 0 0)",
        "primario": "oklch(0.61 0.22 292.72)"
      },
      "dark": {
        "fondo": "oklch(0.21 0.04 265.75)",
        "primario": "oklch(0.61 0.22 292.72)"
      }
    }
  },
  {
    "slug": "supabase",
    "nombre": "Supabase",
    "categoria": "branded",
    "fuente": "Outfit",
    "colores": {
      "light": {
        "fondo": "oklch(0.99 0 0)",
        "primario": "oklch(0.83 0.13 160.91)"
      },
      "dark": {
        "fondo": "oklch(0.18 0 0)",
        "primario": "oklch(0.44 0.1 156.76)"
      }
    }
  },
  {
    "slug": "twitch",
    "nombre": "Twitch",
    "categoria": "branded",
    "fuente": "Inter",
    "colores": {
      "light": {
        "fondo": "oklch(0.97 0.002 0)",
        "primario": "oklch(0.54 0.27 290)"
      },
      "dark": {
        "fondo": "oklch(0.14 0.005 285)",
        "primario": "oklch(0.54 0.27 290)"
      }
    }
  },
  {
    "slug": "kick",
    "nombre": "Kick",
    "categoria": "branded",
    "fuente": "Inter",
    "colores": {
      "light": {
        "fondo": "oklch(1 0 0)",
        "primario": "oklch(0.75 0.28 128)"
      },
      "dark": {
        "fondo": "oklch(0.12 0 0)",
        "primario": "oklch(0.85 0.3 128)"
      }
    }
  },
  {
    "slug": "spotify",
    "nombre": "Spotify",
    "categoria": "branded",
    "fuente": "Montserrat",
    "colores": {
      "light": {
        "fondo": "oklch(1 0 0)",
        "primario": "oklch(0.64 0.18 152)"
      },
      "dark": {
        "fondo": "oklch(0.145 0 0)",
        "primario": "oklch(0.64 0.18 152)"
      }
    }
  },
  {
    "slug": "stripe",
    "nombre": "Stripe",
    "categoria": "branded",
    "fuente": null,
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0.006 240)",
        "primario": "oklch(0.55 0.25 285)"
      },
      "dark": {
        "fondo": "oklch(0.22 0.05 250)",
        "primario": "oklch(0.6 0.23 285)"
      }
    }
  },
  {
    "slug": "github",
    "nombre": "GitHub",
    "categoria": "branded",
    "fuente": null,
    "colores": {
      "light": {
        "fondo": "oklch(1 0 0)",
        "primario": "oklch(0.50 0.15 145)"
      },
      "dark": {
        "fondo": "oklch(0.15 0.012 250)",
        "primario": "oklch(0.55 0.15 145)"
      }
    }
  },
  {
    "slug": "cyberpunk",
    "nombre": "Cyberpunk",
    "categoria": "creative",
    "fuente": "Outfit",
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0 247.84)",
        "primario": "oklch(0.67 0.29 341.41)"
      },
      "dark": {
        "fondo": "oklch(0.16 0.04 281.83)",
        "primario": "oklch(0.67 0.29 341.41)"
      }
    }
  },
  {
    "slug": "neo-brutalism",
    "nombre": "Neo Brutalism",
    "categoria": "creative",
    "fuente": "DM Sans",
    "colores": {
      "light": {
        "fondo": "oklch(1 0 0)",
        "primario": "oklch(0.65 0.24 26.97)"
      },
      "dark": {
        "fondo": "oklch(0 0 0)",
        "primario": "oklch(0.7 0.19 23.19)"
      }
    }
  },
  {
    "slug": "doom-64",
    "nombre": "Doom 64",
    "categoria": "creative",
    "fuente": "Oxanium",
    "colores": {
      "light": {
        "fondo": "oklch(0.85 0 0)",
        "primario": "oklch(0.5 0.19 27.48)"
      },
      "dark": {
        "fondo": "oklch(0.22 0 0)",
        "primario": "oklch(0.61 0.21 27.03)"
      }
    }
  },
  {
    "slug": "kodama-grove",
    "nombre": "Kodama Grove",
    "categoria": "creative",
    "fuente": "Merriweather",
    "colores": {
      "light": {
        "fondo": "oklch(0.88 0.05 91.79)",
        "primario": "oklch(0.67 0.11 118.91)"
      },
      "dark": {
        "fondo": "oklch(0.33 0.02 88.07)",
        "primario": "oklch(0.68 0.06 132.45)"
      }
    }
  },
  {
    "slug": "quantum-rose",
    "nombre": "Quantum Rose",
    "categoria": "creative",
    "fuente": "Quicksand",
    "colores": {
      "light": {
        "fondo": "oklch(0.97 0.02 343.93)",
        "primario": "oklch(0.6 0.24 0.13)"
      },
      "dark": {
        "fondo": "oklch(0.18 0.05 313.72)",
        "primario": "oklch(0.75 0.23 332.02)"
      }
    }
  },
  {
    "slug": "claymorphism",
    "nombre": "Claymorphism",
    "categoria": "creative",
    "fuente": "Plus Jakarta Sans",
    "colores": {
      "light": {
        "fondo": "oklch(0.92 0 48.72)",
        "primario": "oklch(0.59 0.2 277.12)"
      },
      "dark": {
        "fondo": "oklch(0.22 0.01 67.44)",
        "primario": "oklch(0.68 0.16 276.93)"
      }
    }
  },
  {
    "slug": "retro-arcade",
    "nombre": "Retro Arcade",
    "categoria": "creative",
    "fuente": "Outfit",
    "colores": {
      "light": {
        "fondo": "oklch(0.97 0.03 90.1)",
        "primario": "oklch(0.59 0.2 355.89)"
      },
      "dark": {
        "fondo": "oklch(0.27 0.05 219.82)",
        "primario": "oklch(0.59 0.2 355.89)"
      }
    }
  },
  {
    "slug": "vintage-paper",
    "nombre": "Vintage Paper",
    "categoria": "creative",
    "fuente": "Libre Baskerville",
    "colores": {
      "light": {
        "fondo": "oklch(0.96 0.02 90.24)",
        "primario": "oklch(0.62 0.08 65.54)"
      },
      "dark": {
        "fondo": "oklch(0.27 0.01 57.65)",
        "primario": "oklch(0.73 0.06 66.7)"
      }
    }
  },
  {
    "slug": "windows98",
    "nombre": "Windows 98",
    "categoria": "creative",
    "fuente": "Pixelify Sans",
    "colores": {
      "light": {
        "fondo": "oklch(0.5431 0.0927 194.7689)",
        "primario": "oklch(0.2711 0.1879 264.052)"
      },
      "dark": {
        "fondo": "oklch(0.5431 0.0927 194.7689)",
        "primario": "oklch(0.2711 0.1879 264.052)"
      }
    }
  },
  {
    "slug": "cosmic-night",
    "nombre": "Cosmic Night",
    "categoria": "dark",
    "fuente": "Inter",
    "colores": {
      "light": {
        "fondo": "oklch(0.97 0.01 286.15)",
        "primario": "oklch(0.54 0.18 288.03)"
      },
      "dark": {
        "fondo": "oklch(0.17 0.02 283.8)",
        "primario": "oklch(0.72 0.16 290.4)"
      }
    }
  },
  {
    "slug": "midnight-bloom",
    "nombre": "Midnight Bloom",
    "categoria": "dark",
    "fuente": "Montserrat",
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0 0)",
        "primario": "oklch(0.57 0.2 283.08)"
      },
      "dark": {
        "fondo": "oklch(0.23 0.01 264.29)",
        "primario": "oklch(0.57 0.2 283.08)"
      }
    }
  },
  {
    "slug": "graphite",
    "nombre": "Graphite",
    "categoria": "dark",
    "fuente": "Inter",
    "colores": {
      "light": {
        "fondo": "oklch(0.96 0 0)",
        "primario": "oklch(0.49 0 0)"
      },
      "dark": {
        "fondo": "oklch(0.22 0 0)",
        "primario": "oklch(0.71 0 0)"
      }
    }
  },
  {
    "slug": "caffeine",
    "nombre": "Caffeine",
    "categoria": "dark",
    "fuente": null,
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0 0)",
        "primario": "oklch(0.43 0.04 41.99)"
      },
      "dark": {
        "fondo": "oklch(0.18 0 0)",
        "primario": "oklch(0.92 0.05 66.17)"
      }
    }
  },
  {
    "slug": "starry-night",
    "nombre": "Starry Night",
    "categoria": "dark",
    "fuente": "Libre Baskerville",
    "colores": {
      "light": {
        "fondo": "oklch(0.98 0 258.32)",
        "primario": "oklch(0.48 0.12 263.38)"
      },
      "dark": {
        "fondo": "oklch(0.22 0.02 275.84)",
        "primario": "oklch(0.48 0.12 263.38)"
      }
    }
  }
];

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
  return `${slug}-${variante}`;
}
