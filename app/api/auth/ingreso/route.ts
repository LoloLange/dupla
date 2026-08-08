import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { email } = (await request.json().catch(() => ({}))) as {
    email?: string;
  };
  const mail = email?.trim().toLowerCase();
  if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    return NextResponse.json({ error: "Poné un email válido" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error(
      "[auth/ingreso] Falta SUPABASE_SERVICE_ROLE_KEY en .env.local"
    );
    return NextResponse.json(
      { error: "El servidor no está configurado" },
      { status: 500 }
    );
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: lista, error: errLista } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (errLista) {
    console.error("[auth/ingreso] listUsers", errLista);
    return NextResponse.json(
      { error: "No se pudo iniciar sesión" },
      { status: 500 }
    );
  }

  const usuario = lista.users.find((u) => u.email?.toLowerCase() === mail);
  if (!usuario) {
    return NextResponse.json(
      { error: "No hay ninguna cuenta con ese email" },
      { status: 404 }
    );
  }

  const { data: enlace, error: errEnlace } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: mail,
  });
  if (errEnlace || !enlace) {
    console.error("[auth/ingreso] generateLink", errEnlace);
    return NextResponse.json(
      { error: "No se pudo iniciar sesión" },
      { status: 500 }
    );
  }

  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: sesion, error: errVerify } = await anon.auth.verifyOtp({
    email: mail,
    token: enlace.properties.email_otp,
    type: "magiclink",
  });
  if (errVerify || !sesion.session) {
    console.error("[auth/ingreso] verifyOtp", errVerify);
    return NextResponse.json(
      { error: "No se pudo iniciar sesión" },
      { status: 500 }
    );
  }

  return NextResponse.json({ session: sesion.session });
}
