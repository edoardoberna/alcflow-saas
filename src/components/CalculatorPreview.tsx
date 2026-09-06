'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { evaluateOutputs, CalculatorInput, CalculatorOutput } from '@/lib/calculator-engine';
import { supabase } from '@/lib/supabase';

interface Props {
  inputs: CalculatorInput[];
  outputs: CalculatorOutput[];
  primaryColor?: string;
  enableLeadGate?: boolean;
  calculatorId?: string;
  privacyPolicyUrl?: string;
  privacyText?: string;
  postSubmitAction?: 'unlock' | 'redirect';
  redirectUrl?: string;
  webhookUrl?: string;
}

export default function CalculatorPreview({
  inputs,
  outputs,
  primaryColor = '#2563eb',
  enableLeadGate = true,
  calculatorId,
  privacyPolicyUrl,
  privacyText,
  postSubmitAction = 'unlock',
  redirectUrl,
  webhookUrl
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    inputs?.forEach((inp) => {
      initial[inp.variable] = Number(inp.defaultValue) || 0;
    });
    return initial;
  });

  useEffect(() => {
    setValues((prev) => {
      const updated = { ...prev };
      inputs?.forEach((inp) => {
        if (updated[inp.variable] === undefined) {
          updated[inp.variable] = Number(inp.defaultValue) || 0;
        }
      });
      return updated;
    });
  }, [inputs]);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        const height = containerRef.current.scrollHeight;
        window.parent.postMessage(
          {
            type: 'CALCFLOW_RESIZE',
            calculatorId: calculatorId || 'preview',
            height: height + 24
          },
          '*'
        );
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [calculatorId, inputs, outputs, enableLeadGate]);

  const [isUnlocked, setIsUnlocked] = useState(!enableLeadGate);
  const [leadForm, setLeadForm] = useState({ name: '', email: '' });
  const [honeypot, setHoneypot] = useState(''); // Campo Honeypot anti-bot
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [sendingLead, setSendingLead] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const calculated = useMemo(() => evaluateOutputs(outputs || [], values), [outputs, values]);

  const handleChange = (variable: string, val: number) => {
    setValues((prev) => ({ ...prev, [variable]: isNaN(val) ? 0 : val }));
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.email) return;

    // Controllo Anti-Spam Honeypot: se il campo nascosto è compilato, scarta silenziosamente
    if (honeypot.trim().length > 0) {
      console.warn('Invio spam rilevato e neutralizzato.');
      setIsUnlocked(true);
      return;
    }

    if (!privacyAccepted) {
      alert("È necessario accettare l'informativa sulla privacy per procedere.");
      return;
    }

    setSendingLead(true);

    const leadPayload = {
      calculator_id: calculatorId,
      contact_data: {
        fullName: leadForm.name,
        email: leadForm.email,
        privacyAccepted: true,
        consentedAt: new Date().toISOString(),
        privacyPolicyUrl: privacyPolicyUrl || null
      },
      calculation_state: {
        inputs: values,
        results: calculated
      }
    };

    // 1. Salvataggio su Supabase
    if (calculatorId) {
      const { error } = await supabase.from('leads').insert([leadPayload]);
      if (error) console.error('Errore salvataggio lead:', error);
    }

    // 2. Notifica Webhook Istantanea
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'lead.created',
            timestamp: new Date().toISOString(),
            data: leadPayload
          }),
          mode: 'no-cors'
        });
      } catch (err) {
        console.error('Errore webhook:', err);
      }
    }

    setSendingLead(false);

    // 3. Azione Post-Conversione
    if (postSubmitAction === 'redirect' && redirectUrl) {
      setRedirecting(true);
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = redirectUrl;
        } else {
          window.location.href = redirectUrl;
        }
      } catch {
        window.open(redirectUrl, '_blank');
      }
      return;
    }

    setIsUnlocked(true);
  };

  return (
    <div
      ref={containerRef}
      className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-slate-100 font-sans text-slate-900"
    >
      {/* Controlli Dinamici */}
      <div className="space-y-5">
        {inputs?.map((inp) => (
          <div key={inp.id} className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium text-slate-700">
              <span className="text-slate-800 font-semibold">{inp.label}</span>
              {inp.type !== 'select' && (
                <span className="font-bold text-slate-900">
                  {inp.prefix || ''}{values[inp.variable] ?? inp.defaultValue}{inp.suffix || ''}
                </span>
              )}
            </div>

            {(!inp.type || inp.type === 'slider') && (
              <input
                type="range"
                min={inp.min ?? 0}
                max={inp.max ?? 100}
                step={inp.step ?? 1}
                value={values[inp.variable] ?? inp.defaultValue}
                onChange={(e) => handleChange(inp.variable, parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: primaryColor }}
              />
            )}

            {inp.type === 'number' && (
              <div className="relative">
                {inp.prefix && (
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">
                    {inp.prefix}
                  </span>
                )}
                <input
                  type="number"
                  min={inp.min}
                  max={inp.max}
                  step={inp.step ?? 1}
                  value={values[inp.variable] ?? inp.defaultValue}
                  onChange={(e) => handleChange(inp.variable, parseFloat(e.target.value))}
                  className={`w-full text-sm p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition ${
                    inp.prefix ? 'pl-8' : ''
                  }`}
                />
              </div>
            )}

            {inp.type === 'select' && (
              <select
                value={values[inp.variable] ?? inp.defaultValue}
                onChange={(e) => handleChange(inp.variable, parseFloat(e.target.value))}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition cursor-pointer"
              >
                {inp.options?.map((opt, idx) => (
                  <option key={idx} value={opt.value}>
                    {opt.label} ({inp.prefix || ''}{opt.value}{inp.suffix || ''})
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Risultati & Lead Gate */}
      <div className="mt-8 pt-6 border-t border-slate-100 relative">
        <div
          className={`space-y-3 transition-all duration-300 ${
            !isUnlocked ? 'filter blur-md select-none pointer-events-none' : ''
          }`}
        >
          {outputs?.map((out) => (
            <div
              key={out.id}
              className={`p-4 rounded-xl flex justify-between items-center ${
                out.highlight
                  ? 'bg-blue-50/80 border border-blue-200'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <span className="text-sm font-semibold text-slate-700">{out.label}</span>
              <span className="text-xl font-black text-slate-900">
                {out.prefix || ''}
                {calculated[out.variable] !== undefined
                  ? calculated[out.variable].toLocaleString('it-IT')
                  : '0'}
                {out.suffix || ''}
              </span>
            </div>
          ))}
        </div>

        {/* Maschera Form Lead Gate */}
        {!isUnlocked && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/90 rounded-xl p-6 text-center backdrop-blur-xs">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Sblocca il Calcolo Completo
            </h3>
            <p className="text-xs text-slate-600 mb-4 max-w-xs leading-relaxed">
              {postSubmitAction === 'redirect' && redirectUrl
                ? 'Inserisci i tuoi dati per visualizzare la stima e proseguire al passo successivo.'
                : 'Inserisci i tuoi dati per visualizzare la stima in tempo reale e ricevere il report.'}
            </p>

            <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-2.5 text-left">
              {/* Campo Honeypot Invisibile per Umani, visibile solo ai Bot */}
              <div className="hidden opacity-0 absolute -left-[9999px]" aria-hidden="true">
                <input
                  type="text"
                  name="website_hp_url"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Il tuo nome"
                  required
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 transition shadow-2xs"
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="nome@azienda.com"
                  required
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 transition shadow-2xs"
                />
              </div>

              {/* Checkbox GDPR */}
              <div className="flex items-start gap-2 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="gdpr-consent"
                  required
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <label htmlFor="gdpr-consent" className="text-[11px] text-slate-600 leading-tight select-none cursor-pointer">
                  {privacyText || 'Dichiaro di aver letto e accetto la'}{' '}
                  {privacyPolicyUrl ? (
                    <a
                      href={privacyPolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Privacy Policy
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-700">Privacy Policy</span>
                  )}{' '}
                  e acconsento al trattamento dei dati.
                </label>
              </div>

              <button
                type="submit"
                disabled={sendingLead || redirecting}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-3 px-4 text-white text-xs font-bold rounded-lg shadow-md hover:opacity-95 transition cursor-pointer disabled:opacity-50 text-center"
              >
                {redirecting
                  ? 'Reindirizzamento in corso...'
                  : sendingLead
                  ? 'Invio in corso...'
                  : postSubmitAction === 'redirect' && redirectUrl
                  ? 'Invia & Continua →'
                  : 'Rivela i Risultati'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}