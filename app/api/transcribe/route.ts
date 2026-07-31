import { NextRequest, NextResponse } from "next/server";
import { transcribirAudio } from "@/lib/groq/transcribe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const archivo = formData.get("audio");

    if (!(archivo instanceof Blob) || archivo.size === 0) {
      return NextResponse.json(
        { error: "No se recibió un audio válido" },
        { status: 400 }
      );
    }

    console.log("[transcribe] audio recibido:", {
      type: archivo.type,
      size: archivo.size,
      bytes: archivo.size / 1024,
    });

    const texto = await transcribirAudio(archivo);
    console.log("[transcribe] resultado:", JSON.stringify(texto));

    if (!texto) {
      return NextResponse.json(
        { error: "No se pudo entender el audio" },
        { status: 422 }
      );
    }

    return NextResponse.json({ texto });
  } catch (error) {
    console.error("Error en /api/transcribe", error);
    return NextResponse.json(
      { error: "Falló la transcripción del audio" },
      { status: 500 }
    );
  }
}
