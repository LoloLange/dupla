import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PreferenciasProvider } from "@/components/PreferenciasProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Favicon } from "@/components/Favicon";
import { TEMAS } from "@/lib/temas-data";
import "./globals.css";
import "../styles/themes.css";

const FUENTES_POR_SLUG = JSON.stringify(
  Object.fromEntries(
    TEMAS.filter((t) => t.fuente).map((t) => [t.slug, t.fuente])
  )
);

const FAVICON_DEFECTO = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 205 200"><circle cx="70" cy="100" r="70" opacity="0.92" fill="oklch(0.7 0.19 47.6)"/><circle cx="130" cy="100" r="70" opacity="0.92" fill="color-mix(in oklab, oklch(0.7 0.19 47.6) 52%, oklch(0.97 0 106.42))"/><path d="M 100 32 A 72 72 0 0 1 100 168 A 72 72 0 0 1 100 32 Z" fill="color-mix(in oklab, oklch(0.7 0.19 47.6) 65%, oklch(0.22 0.01 56.04))"/></svg>`
)}`;

export const metadata: Metadata = {
  title: "Dupla — tu compañera de gastos",
  description:
    "Cargá gastos con la voz en pesos y dólares. Dupla los entiende, vos los confirmás.",
  icons: { icon: FAVICON_DEFECTO },
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
            __html: `(function(){try{var F=${FUENTES_POR_SLUG};var r=document.documentElement;var p=location.pathname;var esAuth=p.indexOf("/login")===0||p.indexOf("/recuperar")===0;function aplicar(t){if(!t||!/^[a-z0-9-]+-(light|dark)$/.test(t))return;r.setAttribute("data-theme",t);var d=t.endsWith("-dark");r.classList.toggle("dark",d);r.classList.toggle("light",!d);r.style.colorScheme=d?"dark":"light";var s=d?t.slice(0,-5):t.slice(0,-6);var f=F[s];if(f){var v=document.getElementById("dupla-fuente");if(v)v.remove();var l=document.createElement("link");l.id="dupla-fuente";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family="+f.trim().replace(/\\s+/g,"+")+":wght@400;500;600;700&display=swap";document.head.appendChild(l);}}if(esAuth){var mq=window.matchMedia("(prefers-color-scheme: dark)");var aplicarAuth=function(){aplicar(mq.matches?"dupla-clasico-dark":"dupla-clasico-light");};aplicarAuth();mq.addEventListener("change",aplicarAuth);}else{aplicar(localStorage.getItem("dupla-tema"));}function fav(){var cs=window.getComputedStyle(r);var ars=cs.getPropertyValue("--ars").trim();var ink=cs.getPropertyValue("--ink").trim();var bg=cs.getPropertyValue("--bg").trim();if(!ars||!ink||!bg)return false;var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 205 200"><circle cx="70" cy="100" r="70" opacity="0.92" fill="'+ars+'"/><circle cx="130" cy="100" r="70" opacity="0.92" fill="color-mix(in oklab,'+ars+' 52%,'+ink+')"/><path d="M 100 32 A 72 72 0 0 1 100 168 A 72 72 0 0 1 100 32 Z" fill="color-mix(in oklab,'+ars+' 65%,'+bg+')"/></svg>';var ic=document.querySelector('link[rel="icon"]');if(!ic){ic=document.createElement("link");ic.rel="icon";document.head.appendChild(ic);}ic.href="data:image/svg+xml,"+encodeURIComponent(svg);return true;}if(!fav()){addEventListener("DOMContentLoaded",function(){fav();});addEventListener("load",function(){fav();});}if("MutationObserver" in window){new MutationObserver(function(){fav();}).observe(r,{attributes:true,attributeFilter:["data-theme"]});}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-dvh">
        <AuthProvider>
          <ThemeProvider>
            <PreferenciasProvider>
              <Favicon />
              {children}
            </PreferenciasProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
