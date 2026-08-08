"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeProvider";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = useCallback(async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Poné un email válido");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/ingreso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        session?: { access_token: string; refresh_token: string };
      } | null;
      if (!res.ok || !data?.session) {
        setError(data?.error ?? "No se pudo iniciar sesión");
        return;
      }
      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      router.push("/");
    } catch {
      setError("No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }, [email, router]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="anim-fade-up">
        <Logo className="w-14 mb-2" />
        <p className="font-display text-4xl font-semibold tracking-tight text-ink">
          dupla
        </p>
        <p className="mt-1 text-sub text-xs">tu compañero de gastos</p>

        <h1 className="mt-10 font-display text-2xl font-medium tracking-tight text-ink">
          Entrá con tu email
        </h1>
        <p className="mt-1 text-sm text-sub">
          Sin contraseñas. Llegá directo a tu cuaderno.
        </p>

        <div className="mt-8 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && entrar()}
            placeholder="tu@email.com"
            autoFocus
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-faint focus:border-ars"
          />
          <button
            type="button"
            onClick={entrar}
            disabled={enviando}
            className="w-full cursor-pointer rounded-2xl bg-ars py-3.5 font-semibold text-white shadow-lg shadow-ars/25 transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-default disabled:opacity-50"
          >
            {enviando ? "Entrando…" : "Continuar"}
          </button>
        </div>

        {error && (
          <p className="anim-fade-in mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-center text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
