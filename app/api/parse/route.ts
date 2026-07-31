import { NextRequest, NextResponse } from "next/server";
import { parsearTextoATexto } from "@/lib/groq/parse";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      texto?: string;
      ahora?: string;
    };

    const texto = body.texto?.trim();
    if (!texto) {
      return NextResponse.json(
        { error: "Falta el texto a parsear" },
        { status: 400 }
      );
    }

    const ahora = body.ahora && !isNaN(Date.parse(body.ahora)) ? body.ahora : new Date().toISOString();
    console.log("[parse] texto recibido:", JSON.stringify(texto));
    const gasto = await parsearTextoATexto(texto, ahora);
    console.log("[parse] resultado:", JSON.stringify(gasto));

    if (!gasto) {
      return NextResponse.json(
        { error: "No escuché un gasto claro", texto },
        { status: 422 }
      );
    }

    return NextResponse.json({ gasto, texto });
  } catch (error) {
    console.error("Error en /api/parse", error);
    return NextResponse.json(
      { error: "No se pudo interpretar el gasto" },
      { status: 500 }
    );
  }
}
