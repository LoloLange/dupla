import { describe, expect, it } from "vitest";
import { emojiDeMovimiento } from "@/lib/categorias";
import categoriasRaw from "@/data/categorias.json";

const diccionario = categoriasRaw as Record<
  string,
  { emoji: string; keywords: string[] }
>;

describe("emojiDeMovimiento", () => {
  it("usa el keyword de la descripción por encima de la categoría", () => {
    expect(emojiDeMovimiento("Otros", "Pago de Netflix")).toBe(
      diccionario.streaming.emoji
    );
    expect(emojiDeMovimiento("Otros", "Compré en Coto")).toBe(
      diccionario.supermercado.emoji
    );
  });

  it("cae al emoji de la categoría cuando no matchea keywords", () => {
    expect(emojiDeMovimiento("Comida y bares", "Almuerzo en la oficina")).toBe(
      diccionario.restaurante.emoji
    );
    expect(emojiDeMovimiento("Salud", null)).toBe(diccionario.farmacia.emoji);
  });

  it("usa emojis fijos para categorías de ingreso", () => {
    expect(emojiDeMovimiento("Sueldo", "")).toBe("💼");
    expect(emojiDeMovimiento("Freelance", "Changa de fin de semana")).toBe(
      "🧑‍💻"
    );
  });

  it("usa ✨ como último recurso", () => {
    expect(emojiDeMovimiento("Otros", null)).toBe("✨");
    expect(emojiDeMovimiento("No existe", null)).toBe("✨");
  });
});
