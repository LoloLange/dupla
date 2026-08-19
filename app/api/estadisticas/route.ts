import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getUsuarioAutenticado } from "@/lib/auth";

type FilaGasto = {
  id: string;
  monto: number;
  moneda: string;
  tipo: string;
  categoria: string;
  descripcion: string | null;
  fecha: string;
  tags: string[];
  comentario: string | null;
  recurrencia_frecuencia: string | null;
};

function inicioMes(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function inicioSemana(d: Date): Date {
  const copia = new Date(d);
  const dia = copia.getDay();
  const diff = dia === 0 ? 6 : dia - 1;
  copia.setDate(copia.getDate() - diff);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function claveMes(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function etiquetaMes(iso: string): string {
  const [y, m] = iso.split("-");
  const meses = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  return `${meses[Number(m) - 1]} ${Number(y) % 100}`;
}

function diasEntre(a: Date, b: Date): number {
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 86_400_000));
}

const CATEGORIAS_FIJAS = new Set([
  "Vivienda",
  "Servicios",
  "Suscripciones",
]);

function esFijo(g: FilaGasto): boolean {
  if (g.recurrencia_frecuencia) return true;
  return CATEGORIAS_FIJAS.has(g.categoria);
}

export async function GET(request: NextRequest) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  const params = request.nextUrl.searchParams;

  const categoriaParam = params.get("categoria");
  const inicioParam = params.get("inicio");
  const finParam = params.get("fin");
  const rangoParam = params.get("rango");

  if (categoriaParam && inicioParam && finParam) {
    const { data, error } = await supabase
      .from("gastos")
      .select("id, monto, moneda, categoria, descripcion, fecha, tags, comentario")
      .eq("user_id", usuario.id)
      .eq("tipo", "gasto")
      .eq("categoria", categoriaParam)
      .gte("fecha", inicioParam)
      .lte("fecha", finParam)
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error consultando detalle", error);
      return NextResponse.json({ error: "Error al leer el detalle" }, { status: 500 });
    }

    return NextResponse.json({
      gastos: (data ?? []).map((g) => ({
        id: g.id,
        monto: Number(g.monto),
        moneda: g.moneda,
        categoria: g.categoria,
        descripcion: g.descripcion,
        fecha: g.fecha,
        tags: g.tags ?? [],
        comentario: g.comentario,
      })),
    });
  }

  const ahora = new Date();

  let fechaInicio: Date;
  let fechaInicioAnterior: Date;

  if (rangoParam === "7d") {
    fechaInicio = new Date(ahora);
    fechaInicio.setDate(fechaInicio.getDate() - 6);
    fechaInicio.setHours(0, 0, 0, 0);
    fechaInicioAnterior = new Date(fechaInicio);
    fechaInicioAnterior.setDate(fechaInicioAnterior.getDate() - 7);
  } else if (rangoParam === "3m") {
    fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1);
    fechaInicioAnterior = new Date(fechaInicio);
    fechaInicioAnterior.setMonth(fechaInicioAnterior.getMonth() - 3);
  } else if (rangoParam === "1y") {
    fechaInicio = new Date(ahora.getFullYear(), 0, 1);
    fechaInicioAnterior = new Date(fechaInicio.getFullYear() - 1, 0, 1);
  } else if (rangoParam === "all") {
    fechaInicio = new Date(2020, 0, 1);
    fechaInicioAnterior = new Date(2020, 0, 1);
  } else {
    fechaInicio = inicioMes(ahora);
    fechaInicioAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  }

  const hace6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
  const fechaQuery = fechaInicio < hace6Meses ? fechaInicio : hace6Meses;

  const { data, error } = await supabase
    .from("gastos")
    .select("id, monto, moneda, tipo, categoria, descripcion, fecha, tags, comentario, recurrencia_frecuencia")
    .eq("user_id", usuario.id)
    .eq("tipo", "gasto")
    .gte("fecha", fechaQuery.toISOString())
    .order("fecha", { ascending: true });

  if (error) {
    console.error("Error consultando estadísticas", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las estadísticas" },
      { status: 500 }
    );
  }

  const gastos = (data ?? []) as FilaGasto[];
  const monedasDisponibles = [...new Set(gastos.map((g) => g.moneda))].sort();

  const inicioSemActual = inicioSemana(ahora);
  const inicioSemAnterior = new Date(inicioSemActual);
  inicioSemAnterior.setDate(inicioSemAnterior.getDate() - 7);

  const variacion = (actual: number, anterior: number) => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior) * 100;
  };

  const porMoneda: Record<string, {
    porCategoria: Record<string, number>;
    mesActual: number;
    mesAnterior: number;
    semActual: number;
    semAnterior: number;
    porMes: Record<string, number>;
    fijos: number;
    variables: number;
    fijosMesAnterior: number;
    variablesMesAnterior: number;
    porMesFijos: Record<string, number>;
    porMesVariables: Record<string, number>;
    topGastos: Array<{ id: string; monto: number; moneda: string; categoria: string; descripcion: string | null; fecha: string }>;
    totalRango: number;
    totalRangoAnterior: number;
  }> = {};

  for (const m of monedasDisponibles) {
    porMoneda[m] = {
      porCategoria: {},
      mesActual: 0,
      mesAnterior: 0,
      semActual: 0,
      semAnterior: 0,
      porMes: {},
      fijos: 0,
      variables: 0,
      fijosMesAnterior: 0,
      variablesMesAnterior: 0,
      porMesFijos: {},
      porMesVariables: {},
      topGastos: [],
      totalRango: 0,
      totalRangoAnterior: 0,
    };
  }

  for (const g of gastos) {
    const fecha = new Date(g.fecha);
    const total = Number(g.monto);
    const mc = porMoneda[g.moneda];
    if (!mc) continue;

    const mesClave = claveMes(fecha);
    mc.porMes[mesClave] = (mc.porMes[mesClave] ?? 0) + total;

    const esGastoFijo = esFijo(g);
    if (esGastoFijo) {
      mc.porMesFijos[mesClave] = (mc.porMesFijos[mesClave] ?? 0) + total;
    } else {
      mc.porMesVariables[mesClave] = (mc.porMesVariables[mesClave] ?? 0) + total;
    }

    if (fecha >= fechaInicio) {
      mc.totalRango += total;
      mc.mesActual += total;
      mc.porCategoria[g.categoria] = (mc.porCategoria[g.categoria] ?? 0) + total;
      if (esGastoFijo) {
        mc.fijos += total;
      } else {
        mc.variables += total;
      }
    } else if (fecha >= fechaInicioAnterior && fecha < fechaInicio) {
      mc.totalRangoAnterior += total;
    }

    if (rangoParam !== "7d" && rangoParam !== "3m") {
      if (fecha >= inicioMes(ahora) && fecha < fechaInicio) {
        // skip
      } else if (fecha >= fechaInicioAnterior && fecha < fechaInicio) {
        mc.mesAnterior += total;
        if (esGastoFijo) {
          mc.fijosMesAnterior += total;
        } else {
          mc.variablesMesAnterior += total;
        }
      }
    } else {
      if (fecha >= fechaInicioAnterior && fecha < fechaInicio) {
        mc.mesAnterior += total;
        if (esGastoFijo) {
          mc.fijosMesAnterior += total;
        } else {
          mc.variablesMesAnterior += total;
        }
      }
    }

    if (fecha >= inicioSemActual) {
      mc.semActual += total;
    } else if (fecha >= inicioSemAnterior && fecha < inicioSemActual) {
      mc.semAnterior += total;
    }
  }

  const resultado: Record<string, unknown> = {
    monedas: monedasDisponibles,
    rango: rangoParam ?? "month",
  };

  for (const m of monedasDisponibles) {
    const mc = porMoneda[m];
    const catsOrdenadas = Object.entries(mc.porCategoria)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);

    const mesesOrdenados = Object.keys(mc.porMes).sort();
    const tendencia = mesesOrdenados.map((mk) => ({
      mes: mk,
      etiqueta: etiquetaMes(mk),
      total: mc.porMes[mk],
      fijos: mc.porMesFijos[mk] ?? 0,
      variables: mc.porMesVariables[mk] ?? 0,
    }));

    const totalRango = mc.totalRango;
    const dias = diasEntre(fechaInicio, ahora);
    const promedioDiario = totalRango / dias;

    const topGastos = gastos
      .filter((g) => g.moneda === m)
      .sort((a, b) => Number(b.monto) - Number(a.monto))
      .slice(0, 3)
      .map((g) => ({
        id: g.id,
        monto: Number(g.monto),
        moneda: g.moneda,
        categoria: g.categoria,
        descripcion: g.descripcion,
        fecha: g.fecha,
      }));

    resultado[m] = {
      porCategoria: catsOrdenadas,
      comparacionMes: {
        actual: mc.mesActual,
        anterior: mc.mesAnterior,
        variacion: variacion(mc.mesActual, mc.mesAnterior),
      },
      comparacionSemana: {
        actual: mc.semActual,
        anterior: mc.semAnterior,
        variacion: variacion(mc.semActual, mc.semAnterior),
      },
      tendenciaMensual: tendencia,
      promedioDiario,
      topGastos,
      fijos: mc.fijos,
      variables: mc.variables,
      fijosMesAnterior: mc.fijosMesAnterior,
      variablesMesAnterior: mc.variablesMesAnterior,
    };
  }

  return NextResponse.json(resultado);
}
