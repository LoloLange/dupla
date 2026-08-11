import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { crearSesion, hashPassword } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const nombre = typeof body?.nombre === "string" && body.nombre.trim() ? body.nombre.trim() : null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Ingresá un email válido" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: existente } = await admin
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existente) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
  }

  const { data: usuario, error } = await admin
    .from("usuarios")
    .insert({
      email,
      password_hash: hashPassword(password),
      nombre: nombre ?? email.split("@")[0],
    })
    .select("id, email, google_sub, nombre, foto_url")
    .single();
  if (error || !usuario) {
    return NextResponse.json({ error: "No se pudo crear la cuenta, intentá de nuevo" }, { status: 500 });
  }

  await crearSesion(usuario.id);
  return NextResponse.json({ usuario }, { status: 201 });
}
