import { NextResponse } from "next/server";
import { eliminarSesion } from "@/lib/auth";

export async function POST() {
  await eliminarSesion();
  return NextResponse.json({ ok: true });
}
