import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { crearSesion } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";

function decodificarJwt(token: string): Record<string, unknown> | null {
  const [header, payload, ...rest] = token.split(".");
  if (!header || !payload || rest.length === 0) return null;
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("dupla_oauth_state")?.value;
  cookieStore.delete("dupla_oauth_state");

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return NextResponse.redirect(new URL("/login?error=google", url.origin));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google", url.origin));
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${url.origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/login?error=google", url.origin));
  }

  const tokenData = await tokenRes.json();
  const datos = decodificarJwt(String(tokenData.id_token ?? ""));
  const email = typeof datos?.email === "string" ? datos.email : null;
  const sub = typeof datos?.sub === "string" ? datos.sub : null;
  if (!email || !sub) {
    return NextResponse.redirect(new URL("/login?error=google", url.origin));
  }

  const admin = createAdminSupabase();

  const { data: porSub } = await admin
    .from("usuarios")
    .select("id")
    .eq("google_sub", sub)
    .maybeSingle();
  if (porSub) {
    await crearSesion(porSub.id);
    return NextResponse.redirect(new URL("/", url.origin));
  }

  const nombre = typeof datos?.name === "string" && datos.name.trim() ? datos.name.trim() : null;
  const foto = typeof datos?.picture === "string" ? datos.picture : null;

  const { data: porEmail } = await admin
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (porEmail) {
    await admin.from("usuarios").update({ google_sub: sub }).eq("id", porEmail.id);
    await crearSesion(porEmail.id);
    return NextResponse.redirect(new URL("/", url.origin));
  }

  const { data: nuevo, error } = await admin
    .from("usuarios")
    .insert({
      email,
      google_sub: sub,
      nombre: nombre ?? email.split("@")[0],
      foto_url: foto,
    })
    .select("id")
    .single();
  if (error || !nuevo) {
    return NextResponse.redirect(new URL("/login?error=google", url.origin));
  }

  await crearSesion(nuevo.id);
  return NextResponse.redirect(new URL("/", url.origin));
}
