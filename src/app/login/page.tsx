'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-none drop-shadow-[0_0_12px_rgba(77,124,254,0.4)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="loginSigmaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4D7CFE" />
          <stop offset="45%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2CE0A5" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill="#080C14" />
      <rect
        width="496"
        height="496"
        x="8"
        y="8"
        rx="112"
        fill="none"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="10"
      />
      <path
        d="M 380 144 H 156 L 262 256 L 156 368 H 336"
        fill="none"
        stroke="url(#loginSigmaGrad)"
        strokeWidth="52"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 285 316 L 378 368 L 285 420"
        fill="none"
        stroke="#2CE0A5"
        strokeWidth="52"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="262" cy="256" r="26" fill="#FFFFFF" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore durante l’autenticazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void text-ink flex flex-col justify-center items-center p-4 relative selection:bg-accent/30">
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-accent/[0.08] blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md panel p-8 relative z-10 shadow-2xl border-line-strong">
        <div className="flex flex-col items-center text-center mb-7">
          <Link href="/" className="mb-4 group">
            <Mark size={42} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isSignUp ? 'Crea Terminale CalcFlow' : 'Accesso Console Operativa'}
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400 mt-1.5">
            {isSignUp ? 'Inizializzazione credenziali' : 'Inserisci le credenziali di registro'}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose/10 border border-rose/30 text-rose font-mono text-xs rounded-lg flex items-center gap-2">
            <span>✕</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
              Email di Sistema
            </label>
            <input
              type="email"
              required
              placeholder="operatore@azienda.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full !py-3 font-semibold text-sm cursor-pointer shadow-[0_0_20px_rgba(77,124,254,0.4)]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Autenticazione in corso…
              </span>
            ) : isSignUp ? (
              'Crea Account e Procedi'
            ) : (
              'Autentica e Accedi'
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-line text-center">
          {isSignUp ? (
            <p className="text-xs text-slate-400">
              Hai già un account configurato?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-accent-hi font-semibold hover:underline cursor-pointer"
              >
                Accedi qui
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Nuovo terminale aziendale?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="text-accent-hi font-semibold hover:underline cursor-pointer"
              >
                Registrati qui
              </button>
            </p>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="font-mono text-[11px] text-faint hover:text-slate-300 transition">
            ← Torna alla pagina iniziale
          </Link>
        </div>
      </div>
    </div>
  );
}