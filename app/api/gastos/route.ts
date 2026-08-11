import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";
import {
  esCategoriaDeTipo,
  esCategoriaGasto,
  esCategoriaIngreso,
} from "@/lib/types";
import {
  filaDesdeRecurrencia,
  recurrenciaDesdeFila,
} from "@/lib/recurrencia";

const MONEDAS = ["ARS", "USD", "EUR", "BRL", "CLP", "UYU"] as const;
const TIPOS = ["gasto", "ingreso"] as const;

const recurrenciaSchema = z.discriminatedUnion("frecuencia", [
  z.object({
    frecuencia: z.literal("semanal"),
    intervalo: z.number().int().min(1).max(52),
    diaSemana: z.number().int().min(0).max(6),
  }),
  z.object({
    frecuencia: z.literal("mensual"),
    intervalo: z.number().int().min(1).max(12),
    diaMes: z.number().int().min(1).max(31),
  }),
]);

const gastoSchemaBase = z.object({
  monto: z.number().positive(),
  moneda: z.enum(MONEDAS),
  tipo: z.enum(TIPOS),
  categoria: z.string().min(1).max(40),
  descripcion: z.string().max(200).default(""),
  fecha: z.string().datetime().optional(),
  recurrencia: recurrenciaSchema.nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
  comentario: z.string().trim().max(500).optional(),
});

function validarCategoria(
  val: { tipo?: "gasto" | "ingreso"; categoria?: string },
  ctx: z.RefinementCtx
) {
  if (val.categoria === undefined) return;
  const valida =
    val.tipo === undefined
      ? esCategoriaGasto(val.categoria) || esCategoriaIngreso(val.categoria)
      : esCategoriaDeTipo(val.tipo, val.categoria);
  if (!valida) {
    ctx.addIssue({
      code: "custom",
      path: ["categoria"],
      message: "La categoría no corresponde al tipo de movimiento",
    });
  }
}

const gastoSchema = gastoSchemaBase
  .extend({ tipo: z.enum(TIPOS).default("gasto") })
  .superRefine(validarCategoria);
const gastoPatchSchema = gastoSchemaBase.partial().superRefine(validarCategoria);

type FilaGasto = {
  id: string;
  user_id: string;
  monto: number;
  moneda: string;
  tipo: string;
  categoria: string;
  descripcion: string | null;
  fecha: string;
  created_at: string;
  recurrencia_frecuencia: string | null;
  recurrencia_intervalo: number | null;
  recurrencia_dia_semana: number | null;
  recurrencia_dia_mes: number | null;
  tags: string[];
  comentario: string | null;
};

function aGasto(fila: FilaGasto) {
  return {
    id: fila.id,
    user_id: fila.user_id,
    monto: Number(fila.monto),
    moneda: fila.moneda,
    tipo: fila.tipo,
    categoria: fila.categoria,
    descripcion: fila.descripcion,
    fecha: fila.fecha,
    created_at: fila.created_at,
    recurrencia: recurrenciaDesdeFila(fila),
    tags: fila.tags ?? [],
    comentario: fila.comentario,
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const exportar = request.nextUrl.searchParams.get("exportar") === "1";

  let query = supabase.from("gastos").select("*");
  if (exportar) {
    query = query.order("fecha", { ascending: true });
  } else {
    query = query.order("fecha", { ascending: false }).limit(100);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error listando gastos", error);
    return NextResponse.json({ error: "Error al leer los gastos" }, { status: 500 });
  }

  return NextResponse.json({ gastos: (data ?? []).map((f) => aGasto(f as FilaGasto)) });
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

  const { monto, moneda, tipo, categoria, descripcion, fecha, tags, comentario } =
    parsed.data;

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
      tags: tags ?? [],
      comentario: comentario ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error insertando gasto", error);
    return NextResponse.json({ error: "No se pudo guardar el gasto" }, { status: 500 });
  }

  return NextResponse.json({ gasto: aGasto(data as FilaGasto) }, { status: 201 });
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
  const parsed = gastoPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { recurrencia, ...resto } = parsed.data;
  const actualizacion: Record<string, unknown> = { ...resto };
  if (recurrencia !== undefined) {
    Object.assign(actualizacion, filaDesdeRecurrencia(recurrencia));
  }
  if (typeof actualizacion.comentario === "string" && actualizacion.comentario === "") {
    actualizacion.comentario = null;
  }

  const { data, error } = await supabase
    .from("gastos")
    .update(actualizacion)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando gasto", error);
    return NextResponse.json({ error: "No se pudo actualizar el gasto" }, { status: 500 });
  }

  return NextResponse.json({ gasto: aGasto(data as FilaGasto) });
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
