import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { crearSesion, verificarPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Ingresá email y contraseña" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: usuario } = await admin
    .from("usuarios")
    .select("id, email, google_sub, nombre, foto_url, password_hash")
    .eq("email", email)
    .maybeSingle();
  if (!usuario || !usuario.password_hash) {
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  if (!verificarPassword(password, usuario.password_hash)) {
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  await crearSesion(usuario.id);
  return NextResponse.json({
    usuario: {
      id: usuario.id,
      email: usuario.email,
      google_sub: usuario.google_sub,
      nombre: usuario.nombre,
      foto_url: usuario.foto_url,
    },
  });
}
