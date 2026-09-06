'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 1.5 18 6v8l-8 4.5L2 14V6l8-4.5Z" stroke="#4D7CFE" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 1.5V10m0 0 8-4m-8 4-8-4" stroke="#4D7CFE" strokeWidth="1.4" strokeLinejoin="round" opacity="0.5" />
      <path d="M10 10v8.5L18 14V6" fill="#4D7CFE" fillOpacity="0.15" stroke="none" />
    </svg>
  );
}

function IconArrowUpRight() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2 10 10 2M3.8 2H10v6.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Rileva se la pagina è stata aperta con ?mode=signup
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Se l'utente è già loggato, reindirizza direttamente alla dashboard
  useEffect(() => {
    async function checkCurrentSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    }
    checkCurrentSession();
  }, [router]);

  // Sincronizza lo stato locale se l'utente naviga tra ?mode=signup e ?mode=signin
  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          // Accesso immediato senza conferma email obbligatoria
          router.push('/dashboard');
        } else {
          // Se Supabase richiede conferma email via link
          setSuccessMessage('Registrazione avviata. Controlla la tua email per confermare l’account.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante l’autenticazione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative panel overflow-hidden p-6 sm:p-8 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.8)]">
        <div className="edge-light" />

        {/* Intestazione del Terminale di Auth */}
        <div className="flex items-center justify-between pb-5 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Mark size={20} />
            <span className="font-mono text-[13px] font-bold tracking-[0.1em] text-ink">
              CALCFLOW
            </span>
          </div>
          <span className="chip !py-0.5 !px-2 !text-[8px] text-mint border-mint/30 bg-mint/5">
            <span className="dot-live" />
            AUTH GATEWAY
          </span>
        </div>

        {/* Switcher Accedi / Registrati */}
        <div className="grid grid-cols-2 gap-1 p-1 mt-6 rounded-lg bg-raised border border-line">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`py-2 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] rounded-md transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-overlay text-ink border border-line-strong shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`py-2 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] rounded-md transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-overlay text-ink border border-line-strong shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            Registrati
          </button>
        </div>

        <div className="mt-6 mb-5">
          <h1 className="text-xl font-bold tracking-tight text-ink">
            {mode === 'signin' ? 'Accedi al terminale' : 'Crea il tuo profilo operatore'}
          </h1>
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            {mode === 'signin'
              ? 'Inserisci le credenziali per consultare telemetria e registri.'
              : 'Inizia gratis con il piano Free. Nessuna carta di credito richiesta.'}
          </p>
        </div>

        {/* Avvisi Errore / Successo */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg border border-rose/30 bg-rose/[0.07] font-mono text-xs text-rose anim-pop">
            ✕ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg border border-mint/30 bg-mint/[0.07] font-mono text-xs text-mint anim-pop">
            ✓ {successMessage}
          </div>
        )}

        {/* Form Credenziali */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="auth-email"
              className="block font-mono text-[9px] uppercase tracking-[0.2em] text-faint mb-1.5"
            >
              Indirizzo email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              placeholder="operatore@azienda.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field field-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="auth-password"
                className="block font-mono text-[9px] uppercase tracking-[0.2em] text-faint"
              >
                Password
              </label>
            </div>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field field-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full !py-3 !mt-6 cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Elaborazione protocollo…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                {mode === 'signin' ? 'Autentica sessione' : 'Registra nuovo account'}
                <IconArrowUpRight />
              </span>
            )}
          </button>
        </form>

        {/* Footer della card */}
        <div className="mt-6 pt-4 border-t border-line text-center font-mono text-[10px] text-faint">
          <Link href="/" className="hover:text-muted transition-colors">
            ← Torna alla vetrina pubblica
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-void text-ink antialiased flex flex-col justify-center px-4 py-12 relative selection:bg-accent/30">
      {/* Sfondo tecnico Institutional Terminal */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 bg-grid opacity-30"
          style={{
            maskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, black, transparent 75%)',
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-accent/[0.07] blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Suspense
          fallback={
            <div className="w-full max-w-md mx-auto panel p-8 text-center font-mono text-xs text-faint">
              Inizializzazione gateway di autenticazione…
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}