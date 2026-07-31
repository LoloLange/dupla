import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const MONEDAS = ["ARS", "USD"] as const;

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("patrimonio")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error leyendo patrimonio", error);
    return NextResponse.json({ error: "Error al leer el patrimonio" }, { status: 500 });
  }

  const saldo = { ARS: 0, USD: 0 };
  for (const fila of data ?? []) {
    saldo[fila.moneda as "ARS" | "USD"] = Number(fila.saldo);
  }

  return NextResponse.json({ saldo });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const moneda = request.nextUrl.searchParams.get("moneda");
  const body = (await request.json().catch(() => ({}))) as unknown;
  const parsed = z
    .object({ saldo: z.number().min(0) })
    .safeParse(body);

  if (!parsed.success || !moneda || !MONEDAS.includes(moneda as "ARS")) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("patrimonio")
    .upsert(
      { user_id: user.id, moneda, saldo: parsed.data.saldo, updated_at: new Date().toISOString() },
      { onConflict: "user_id,moneda" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error actualizando patrimonio", error);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }

  return NextResponse.json({ patrimonio: data });
}
