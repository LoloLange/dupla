"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Paso = "email" | "codigo";

export default function LoginPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviarCodigo = useCallback(async () => {
    if (!email.includes("@")) {
      setError("Poné un email válido");
      return;
    }
    setEnviando(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setEnviando(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPaso("codigo");
  }, [email]);

  const verificarCodigo = useCallback(async () => {
    setEnviando(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: codigo.trim(),
      type: "email",
    });
    setEnviando(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/");
  }, [email, codigo, router]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
      <div className="anim-fade-up">
        <p className="font-display text-4xl font-semibold tracking-tight text-ink">
          dupla
        </p>
        <p className="mt-1 text-sub">tu compañera de gastos</p>

        <h1 className="mt-10 font-display text-2xl font-medium tracking-tight text-ink">
          {paso === "email" ? "Entrá con tu email" : "Te mandamos un código"}
        </h1>
        <p className="mt-1 text-sm text-sub">
          {paso === "email"
            ? "Sin contraseñas. Llegá directo a tu cuaderno."
            : `Ingresalo abajo para entrar a ${email}`}
        </p>

        <div className="mt-8 space-y-3">
          {paso === "email" ? (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarCodigo()}
                placeholder="tu@email.com"
                autoFocus
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-faint focus:border-ars"
              />
              <button
                type="button"
                onClick={enviarCodigo}
                disabled={enviando}
                className="w-full rounded-2xl bg-ars py-3.5 font-semibold text-white shadow-lg shadow-ars/25 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {enviando ? "Enviando…" : "Continuar"}
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                inputMode="numeric"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verificarCodigo()}
                placeholder="000000"
                autoFocus
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-center font-mono text-2xl tracking-[0.4em] text-ink outline-none transition-colors placeholder:text-faint focus:border-ars"
              />
              <button
                type="button"
                onClick={verificarCodigo}
                disabled={enviando}
                className="w-full rounded-2xl bg-ars py-3.5 font-semibold text-white shadow-lg shadow-ars/25 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {enviando ? "Verificando…" : "Entrar"}
              </button>
              <button
                type="button"
                onClick={() => setPaso("email")}
                className="w-full text-center text-sm text-sub hover:text-ink"
              >
                Usar otro email
              </button>
            </>
          )}
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
