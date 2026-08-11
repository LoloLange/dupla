"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Modo = "entrar" | "registro";

function BotonGoogle({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <button
      type="button"
      onClick={() => router.push("/api/auth/google")}
      className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-line bg-surface py-3 font-semibold text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:shadow active:scale-[0.99]"
    >
      <svg viewBox="0 0 24 24" className="size-5">
        <path
          fill="#4285F4"
          d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.1 3.56-5.17 3.56-8.82Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.28v3.11A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.28A7.2 7.2 0 0 1 4.92 12c0-.79.14-1.56.36-2.28V6.61H1.28a12 12 0 0 0 0 10.78l4-3.11Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
        />
      </svg>
      Continuar con Google
    </button>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContenido />
    </Suspense>
  );
}

function LoginContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const errorGoogle =
    searchParams.get("error") === "google"
      ? "No se pudo iniciar sesión con Google. Intentá de nuevo."
      : null;

  const entrar = useCallback(
    async (modoActivo: Modo) => {
      const emailValido = EMAIL_RE.test(email.trim());
      if (!emailValido) {
        setError("Poné un email válido");
        return;
      }
      if (modoActivo === "registro") {
        if (nombre.trim().length < 2) {
          setError("Poné tu nombre para crear la cuenta");
          return;
        }
        if (password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres");
          return;
        }
      } else if (password.length === 0) {
        setError("Poné tu contraseña");
        return;
      }

      setEnviando(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/auth/${modoActivo === "registro" ? "registro" : "login"}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              password,
              ...(modoActivo === "registro" ? { nombre: nombre.trim() } : {}),
            }),
          }
        );
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (!res.ok) {
          setError(data?.error ?? "No se pudo iniciar sesión");
          return;
        }
        router.push(searchParams.get("next") || "/");
        router.refresh();
      } catch {
        setError("No se pudo conectar. Intentá de nuevo.");
      } finally {
        setEnviando(false);
      }
    },
    [email, password, nombre, router, searchParams]
  );

  const cambiarModo = useCallback((nuevo: Modo) => {
    setModo(nuevo);
    setError(null);
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
      <div className="anim-fade-up">
        <Logo className="mb-2 w-14" />
        <p className="font-display text-4xl font-semibold tracking-tight text-ink">
          dupla
        </p>
        <p className="mt-1 text-xs text-sub">tu compañero de gastos</p>

        <div className="mt-10 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
          {(
            [
              ["entrar", "Entrar"],
              ["registro", "Crear cuenta"],
            ] as const
          ).map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              onClick={() => cambiarModo(valor)}
              className={`cursor-pointer rounded-xl py-2.5 text-sm font-semibold transition-all ${
                modo === valor
                  ? "bg-ars text-white shadow"
                  : "text-sub hover:text-ink"
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-xs font-medium text-sub">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoFocus
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-faint focus:border-ars"
            />
          </div>

          {modo === "registro" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="nombre" className="text-xs font-medium text-sub">
                Tu nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Cómo querés que te diga dupla"
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-faint focus:border-ars"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-xs font-medium text-sub"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !enviando && void entrar(modo)
              }
              placeholder={modo === "registro" ? "Mínimo 6 caracteres" : "••••••••"}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-faint focus:border-ars"
            />
          </div>

          <button
            type="button"
            onClick={() => void entrar(modo)}
            disabled={enviando}
            className="w-full cursor-pointer rounded-2xl bg-ars py-3.5 font-semibold text-white shadow-lg shadow-ars/25 transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-default disabled:opacity-50"
          >
            {enviando
              ? "Un momento…"
              : modo === "registro"
                ? "Crear mi cuenta"
                : "Entrar"}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-sub">o</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <BotonGoogle router={router} />
        </div>

        <p className="mt-5 text-center text-xs text-sub">
          {modo === "registro"
            ? "Al crear tu cuenta, entrás directo a tu cuaderno."
            : "Tus gastos son solo tuyos. Esto queda en tu cuenta."}
        </p>

        {error && (
          <p className="anim-fade-in mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-center text-sm text-danger">
            {error}
          </p>
        )}
        {!error && errorGoogle && (
          <p className="anim-fade-in mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-center text-sm text-danger">
            {errorGoogle}
          </p>
        )}
      </div>
    </main>
  );
}
