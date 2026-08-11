import { NextResponse } from "next/server";
import { getPerfilDeUsuario, getUsuarioAutenticado } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const perfil = await getPerfilDeUsuario(usuario.id);
  return NextResponse.json({ usuario, perfil });
}

export async function PATCH(request: Request) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const cambiosUsuario: Record<string, unknown> = {};
  if (typeof body.nombre === "string") {
    const nombre = body.nombre.trim();
    if (nombre.length < 2 || nombre.length > 60) {
      return NextResponse.json({ error: "El nombre debe tener entre 2 y 60 caracteres" }, { status: 400 });
    }
    cambiosUsuario.nombre = nombre;
  }
  if (typeof body.foto_url === "string") {
    if (body.foto_url.length > 40000) {
      return NextResponse.json({ error: "La foto es demasiado grande" }, { status: 400 });
    }
    cambiosUsuario.foto_url = body.foto_url;
  }
  if (Object.keys(cambiosUsuario).length > 0) {
    const { error } = await admin.from("usuarios").update(cambiosUsuario).eq("id", usuario.id);
    if (error) return NextResponse.json({ error: "No se pudo guardar el perfil" }, { status: 500 });
  }

  const cambiosPerfil: Record<string, unknown> = {};
  if (typeof body.tema === "string" && /^[a-z0-9-]+-(light|dark)$/.test(body.tema)) {
    cambiosPerfil.tema = body.tema;
  }
  if (typeof body.moneda_secundaria === "string" || body.moneda_secundaria === null) {
    cambiosPerfil.moneda_secundaria = body.moneda_secundaria;
  }
  if (typeof body.ver_detalle_monedas === "boolean") {
    cambiosPerfil.ver_detalle_monedas = body.ver_detalle_monedas;
  }
  if (typeof body.ver_balance === "boolean") {
    cambiosPerfil.ver_balance = body.ver_balance;
  }
  if (Object.keys(cambiosPerfil).length > 0) {
    const { error } = await admin.from("perfiles").upsert(
      {
        user_id: usuario.id,
        ...cambiosPerfil,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) return NextResponse.json({ error: "No se pudieron guardar las preferencias" }, { status: 500 });
  }

  const { data: usuarioActualizado } = await admin
    .from("usuarios")
    .select("id, email, google_sub, nombre, foto_url")
    .eq("id", usuario.id)
    .maybeSingle();

  const perfil = await getPerfilDeUsuario(usuario.id);
  return NextResponse.json({ usuario: usuarioActualizado, perfil });
}
