"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

const TAMANO = 64;

function pintarFavicon(): string | null {
  const cs = getComputedStyle(document.documentElement);
  const ars = cs.getPropertyValue("--ars").trim();
  const ink = cs.getPropertyValue("--ink").trim();
  const bg = cs.getPropertyValue("--bg").trim();
  if (!ars || !ink || !bg) return null;

  const canvas = document.createElement("canvas");
  canvas.width = TAMANO;
  canvas.height = TAMANO;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(TAMANO / 205, TAMANO / 200);

  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.arc(70, 100, 70, 0, Math.PI * 2);
  ctx.fillStyle = ars;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(130, 100, 70, 0, Math.PI * 2);
  ctx.fillStyle = `color-mix(in oklab, ${ars} 52%, ${ink})`;
  ctx.fill();

  ctx.fillStyle = `color-mix(in oklab, ${ars} 65%, ${bg})`;
  const lente = new Path2D(
    "M 100 32 A 72 72 0 0 1 100 168 A 72 72 0 0 1 100 32 Z"
  );
  ctx.fill(lente);
  ctx.globalAlpha = 1;

  return canvas.toDataURL("image/png");
}

export function Favicon() {
  const { tema } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const href = pintarFavicon();
    if (!href) return;
    const link = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"]'
    );
    if (link) link.href = href;
  }, [tema, pathname]);

  return null;
}
