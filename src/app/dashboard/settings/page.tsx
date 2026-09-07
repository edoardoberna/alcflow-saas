'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setEmail(user.email || '');
    }
    getUser();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setStatusMsg({ type: 'err', text: 'La password deve contenere almeno 6 caratteri.' });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatusMsg({ type: 'err', text: error.message });
    } else {
      setStatusMsg({ type: 'ok', text: 'Password aggiornata con successo!' });
      setNewPassword('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Barra Superiore */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-slate-300 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 transition"
          >
            <span>←</span> Torna al Registro Operativo
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-ghost btn-sm text-xs text-rose hover:bg-rose/10 cursor-pointer font-mono"
          >
            Disconnetti Account
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Impostazioni & Centro Integrazioni</h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestisci la sicurezza del tuo account, le chiavi webhook e la documentazione del motore.
          </p>
        </div>

        {statusMsg && (
          <div className={`p-4 rounded-xl border text-xs font-mono ${
            statusMsg.type === 'ok' ? 'bg-mint/10 border-mint/30 text-mint' : 'bg-rose/10 border-rose/30 text-rose'
          }`}>
            {statusMsg.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card Sicurezza Account */}
          <div className="panel p-6 border-white/10 bg-[#0C1019] space-y-4">
            <h3 className="font-bold text-sm text-white">Sicurezza & Accesso</h3>
            <div className="space-y-1">
              <label className="block text-[11px] font-mono uppercase text-slate-400">Email di Login</label>
              <input
                type="text"
                disabled
                value={email}
                className="field field-mono text-xs opacity-60 cursor-not-allowed"
              />
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3 pt-2">
              <label className="block text-[11px] font-mono uppercase text-slate-400">Nuova Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Almeno 6 caratteri"
                className="field text-xs"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm w-full font-bold cursor-pointer"
              >
                Aggiorna Password
              </button>
            </form>
          </div>

          {/* Card Hub Webhook / Automazioni */}
          <div className="panel p-6 border-white/10 bg-[#0C1019] space-y-4">
            <h3 className="font-bold text-sm text-white">Integrazioni Esterne</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Puoi collegare CalcFlow direttamente a:
            </p>
            <ul className="space-y-2 text-xs text-slate-400 font-mono">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <strong>Make.com</strong> (Invia a Google Sheets, WhatsApp, CRM)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-mint" />
                <strong>Zapier</strong> (Notifiche Slack / Email automatiche)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
                <strong>n8n</strong> (Automazioni self-hosted)
              </li>
            </ul>
            <div className="p-3 bg-black/30 rounded-lg border border-white/5 text-[11px] text-slate-400">
              💡 Configura il link del tuo Webhook direttamente all&apos;interno della scheda <strong>3. Lead Gate</strong> di ciascun calcolatore.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}