import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createAdminSupabase } from "@/lib/supabase/admin";

const NOMBRE_COOKIE = "dupla_sesion";
const DURACION_SESION_DIAS = 30;

export type Usuario = {
  id: string;
  email: string;
  google_sub: string | null;
  nombre: string | null;
  foto_url: string | null;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verificarPassword(password: string, almacenada: string): boolean {
  const [salt, hash] = almacenada.split(":");
  if (!salt || !hash) return false;
  const prueba = scryptSync(password, salt, 64);
  const esperado = Buffer.from(hash, "hex");
  return prueba.length === esperado.length && timingSafeEqual(prueba, esperado);
}

export async function crearSesion(usuarioId: string) {
  const token = randomBytes(32).toString("base64url");
  const admin = createAdminSupabase();
  const { error } = await admin.from("sesiones").insert({
    token: hashToken(token),
    usuario_id: usuarioId,
    expira_en: new Date(Date.now() + DURACION_SESION_DIAS * 86400000).toISOString(),
  });
  if (error) throw new Error("No se pudo crear la sesión");

  const cookieStore = await cookies();
  cookieStore.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_DIAS * 86400,
  });
}

export async function eliminarSesion() {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOMBRE_COOKIE)?.value;
  if (token) {
    const admin = createAdminSupabase();
    await admin.from("sesiones").delete().eq("token", hashToken(token));
  }
  cookieStore.delete(NOMBRE_COOKIE);
}

export async function getUsuarioAutenticado(): Promise<Usuario | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOMBRE_COOKIE)?.value;
  if (!token) return null;

  const admin = createAdminSupabase();
  const { data: sesion } = await admin
    .from("sesiones")
    .select("usuario_id, expira_en")
    .eq("token", hashToken(token))
    .maybeSingle();
  if (!sesion || new Date(sesion.expira_en).getTime() < Date.now()) return null;

  const { data: usuario } = await admin
    .from("usuarios")
    .select("id, email, google_sub, nombre, foto_url")
    .eq("id", sesion.usuario_id)
    .maybeSingle();
  if (!usuario) return null;

  return {
    id: usuario.id,
    email: usuario.email,
    google_sub: usuario.google_sub,
    nombre: usuario.nombre,
    foto_url: usuario.foto_url,
  };
}

export type Perfil = {
  user_id: string;
  tema: string | null;
  moneda_secundaria: string | null;
  ver_detalle_monedas: boolean | null;
  ver_balance: boolean | null;
};

export async function getPerfilDeUsuario(usuarioId: string): Promise<Perfil | null> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("perfiles")
    .select("user_id, tema, moneda_secundaria, ver_detalle_monedas, ver_balance")
    .eq("user_id", usuarioId)
    .maybeSingle();
  return (data as Perfil | null) ?? null;
}

export { NOMBRE_COOKIE };
