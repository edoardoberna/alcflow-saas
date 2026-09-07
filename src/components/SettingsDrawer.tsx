'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function SettingsDrawer({ isOpen, onClose, userEmail }: SettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'integrations' | 'guide'>('account');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [updating, setUpdating] = useState(false);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMsg({ type: 'err', text: 'La password deve contenere almeno 6 caratteri.' });
      return;
    }
    setUpdating(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdating(false);
    if (error) {
      setMsg({ type: 'err', text: error.message });
    } else {
      setMsg({ type: 'ok', text: 'Password aggiornata con successo!' });
      setNewPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#090D16] border-l border-white/10 h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 shadow-2xl"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Pannello Impostazioni</h2>
              <span className="text-[11px] font-mono text-slate-400">CONFIGURAZIONE GLOBALE</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white font-mono text-sm px-2 py-1 rounded bg-white/5 border border-white/10 cursor-pointer"
            >
              ✕ Chiudi
            </button>
          </div>

          {/* Tab di Navigazione Interna */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 border border-white/10 rounded-xl font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`py-2 rounded-lg text-center font-bold transition cursor-pointer ${
                activeTab === 'account' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Account
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('integrations')}
              className={`py-2 rounded-lg text-center font-bold transition cursor-pointer ${
                activeTab === 'integrations' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Webhook Hub
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`py-2 rounded-lg text-center font-bold transition cursor-pointer ${
                activeTab === 'guide' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Guida
            </button>
          </div>

          {msg && (
            <div className={`p-3 rounded-lg text-xs font-mono border ${
              msg.type === 'ok' ? 'bg-mint/10 border-mint/30 text-mint' : 'bg-rose/10 border-rose/30 text-rose'
            }`}>
              {msg.text}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Email Registrata</label>
                <input
                  type="text"
                  disabled
                  value={userEmail}
                  className="field field-mono text-xs opacity-60 cursor-not-allowed bg-black/50"
                />
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-[11px] font-mono uppercase text-slate-400 block">Piano Corrente</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-mint font-mono text-sm">PROTOTIPO FREE</span>
                  <span className="badge badge-mint">ATTIVO</span>
                </div>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-3 pt-2">
                <label className="block text-[11px] font-mono uppercase text-slate-400">Modifica Password</label>
                <input
                  type="password"
                  placeholder="Minimo 6 caratteri"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="field text-xs bg-black/50"
                />
                <button
                  type="submit"
                  disabled={updating}
                  className="btn btn-primary btn-sm w-full font-bold text-xs cursor-pointer"
                >
                  {updating ? 'Aggiornamento…' : 'Salva Nuova Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                CalcFlow invia automaticamente i lead verso qualsiasi endpoint webhook compatibile:
              </p>
              <div className="space-y-2 text-xs font-mono text-slate-400">
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                  <span className="text-white font-bold block mb-0.5">Make.com / Zapier</span>
                  Invia contatti a Google Sheets, Notion o CRM aziendali.
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                  <span className="text-white font-bold block mb-0.5">Slack & Telegram Bot</span>
                  Ricevi una notifica push sul telefono ad ogni nuovo preventivo.
                </div>
              </div>
              <div className="p-3 bg-accent/[0.07] border border-accent/20 rounded-xl text-[11px] text-slate-300">
                💡 Il link del Webhook si inserisce direttamente dentro la scheda <strong>3. Lead Gate</strong> di ciascun calcolatore.
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                <strong className="text-accent-hi font-mono text-[11px] block">1. Variabili</strong>
                Usa sempre identificatori in minuscolo senza spazi (es. <code className="text-mint font-mono">mq</code>, <code className="text-mint font-mono">ore</code>).
              </div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                <strong className="text-accent-hi font-mono text-[11px] block">2. Formule</strong>
                Usa le parentesi per le priorità: <code className="text-mint font-mono">(ore * 50) + 100</code>.
              </div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                <strong className="text-accent-hi font-mono text-[11px] block">3. Inserimento sul sito</strong>
                Copia il codice dal tasto "Codice Embed" e incollalo come blocco HTML nella pagina del tuo sito.
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-white/10 text-center font-mono text-[10px] text-slate-500">
          CALCFLOW PLATFORM V2.6
        </div>
      </div>
    </div>
  );
}