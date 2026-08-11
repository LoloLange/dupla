import { NextResponse, type NextRequest } from "next/server";

const NOMBRE_COOKIE = "dupla_sesion";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const esLogin = pathname.startsWith("/login");
  const esAuth = pathname.startsWith("/api/auth");
  const token = request.cookies.get(NOMBRE_COOKIE)?.value;

  if (!token && !esLogin && !esAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (token && esLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
