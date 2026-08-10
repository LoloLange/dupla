import { NextRequest, NextResponse } from "next/server";
import { parsearTextoATexto } from "@/lib/groq/parse";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      texto?: string;
      ahora?: string;
      offset?: number;
    };

    const texto = body.texto?.trim();
    if (!texto) {
      return NextResponse.json(
        { error: "Falta el texto a parsear" },
        { status: 400 }
      );
    }

    const ahoraUtc =
      body.ahora && !isNaN(Date.parse(body.ahora))
        ? body.ahora
        : new Date().toISOString();
    const offsetMinutos =
      typeof body.offset === "number" && Number.isFinite(body.offset)
        ? body.offset
        : new Date().getTimezoneOffset();
    const ahoraLocal = new Date(
      Date.parse(ahoraUtc) - offsetMinutos * 60000
    )
      .toISOString()
      .slice(0, 19);
    console.log("[parse] texto recibido:", JSON.stringify(texto));
    const gastos = await parsearTextoATexto(texto, ahoraLocal, offsetMinutos);
    console.log("[parse] resultado:", JSON.stringify(gastos));

    if (gastos.length === 0) {
      return NextResponse.json(
        { error: "No escuché un gasto claro", texto },
        { status: 422 }
      );
    }

    return NextResponse.json({ gastos, texto });
  } catch (error) {
    console.error("Error en /api/parse", error);
    return NextResponse.json(
      { error: "No se pudo interpretar el gasto" },
      { status: 500 }
    );
  }
}
