import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";
import { CATEGORIAS } from "@/lib/types";

const MONEDAS = ["ARS", "USD"] as const;
const TIPOS = ["gasto", "ingreso"] as const;

const gastoSchema = z.object({
  monto: z.number().positive(),
  moneda: z.enum(MONEDAS),
  tipo: z.enum(TIPOS).default("gasto"),
  categoria: z.enum(CATEGORIAS),
  descripcion: z.string().max(200).default(""),
  fecha: z.string().datetime().optional(),
});

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .order("fecha", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error listando gastos", error);
    return NextResponse.json({ error: "Error al leer los gastos" }, { status: 500 });
  }

  return NextResponse.json({ gastos: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as unknown;
  const parsed = gastoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de gasto inválidos", detalle: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { monto, moneda, tipo, categoria, descripcion, fecha } = parsed.data;

  const { data, error } = await supabase
    .from("gastos")
    .insert({
      user_id: user.id,
      monto,
      moneda,
      tipo,
      categoria,
      descripcion,
      fecha: fecha ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error insertando gasto", error);
    return NextResponse.json({ error: "No se pudo guardar el gasto" }, { status: 500 });
  }

  return NextResponse.json({ gasto: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el id" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as unknown;
  const parsed = gastoSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("gastos")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando gasto", error);
    return NextResponse.json({ error: "No se pudo actualizar el gasto" }, { status: 500 });
  }

  return NextResponse.json({ gasto: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el id" }, { status: 400 });

  const { error } = await supabase
    .from("gastos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error eliminando gasto", error);
    return NextResponse.json({ error: "No se pudo eliminar el gasto" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
