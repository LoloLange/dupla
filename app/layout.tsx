import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TEMAS } from "@/lib/temas-data";
import "./globals.css";
import "../styles/themes.css";

const FUENTES_POR_SLUG = JSON.stringify(
  Object.fromEntries(
    TEMAS.filter((t) => t.fuente).map((t) => [t.slug, t.fuente])
  )
);

export const metadata: Metadata = {
  title: "Dupla — tu compañera de gastos",
  description:
    "Cargá gastos con la voz en pesos y dólares. Dupla los entiende, vos los confirmás.",
};

export const viewport: Viewport = {
  themeColor: "#171310",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className="dark"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var F=${FUENTES_POR_SLUG};var t=localStorage.getItem("dupla-tema");if(!t||!/^[a-z0-9-]+-(light|dark)$/.test(t))return;var r=document.documentElement;r.setAttribute("data-theme",t);var d=t.endsWith("-dark");r.classList.toggle("dark",d);r.classList.toggle("light",!d);r.style.colorScheme=d?"dark":"light";var s=d?t.slice(0,-5):t.slice(0,-6);var f=F[s];if(f){var l=document.createElement("link");l.id="dupla-fuente";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family="+f.trim().replace(/\\s+/g,"+")+":wght@400;500;600;700&display=swap";document.head.appendChild(l);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-dvh">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
