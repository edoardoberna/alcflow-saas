'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { evaluateFormula, CalculatorInput, CalculatorOutput } from '@/lib/calculator-engine';
import { supabase } from '@/lib/supabase';

interface CalculatorPreviewProps {
  calculatorId?: string | null;
  inputs?: CalculatorInput[];
  outputs?: CalculatorOutput[];
  primaryColor?: string;
  enableLeadGate?: boolean;
  privacyPolicyUrl?: string;
  privacyText?: string;
  postSubmitAction?: 'unlock' | 'redirect';
  redirectUrl?: string;
  webhookUrl?: string;
}

const isValidUUID = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const formatSafeNumber = (num: unknown): string => {
  const n = typeof num === 'number' ? num : Number(num);
  if (isNaN(n) || !isFinite(n)) return '0';
  return n.toLocaleString('it-IT', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
};

export default function CalculatorPreview({
  calculatorId = null,
  inputs = [],
  outputs = [],
  primaryColor = '#00F0FF',
  enableLeadGate = true,
  privacyPolicyUrl = '',
  privacyText = 'Dichiaro di aver letto e accetto la',
  postSubmitAction = 'unlock',
  redirectUrl = '',
  webhookUrl = ''
}: CalculatorPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    (inputs || []).forEach((inp) => {
      if (inp?.variable) {
        initial[inp.variable] = Number(inp.defaultValue ?? inp.min ?? 0);
      }
    });
    return initial;
  });

  const [isUnlocked, setIsUnlocked] = useState<boolean>(!enableLeadGate);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      (inputs || []).forEach((inp) => {
        if (inp?.variable && next[inp.variable] === undefined) {
          next[inp.variable] = Number(inp.defaultValue ?? inp.min ?? 0);
        }
      });
      return next;
    });
  }, [inputs]);

  useEffect(() => {
    if (!enableLeadGate) {
      setIsUnlocked(true);
    }
  }, [enableLeadGate]);

  useEffect(() => {
    if (!calculatorId || typeof window === 'undefined') return;

    const notifyHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.scrollHeight;
        window.parent.postMessage(
          { type: 'CALCFLOW_RESIZE', calculatorId, height },
          '*'
        );
      }
    };

    notifyHeight();
    const observer = new ResizeObserver(notifyHeight);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [calculatorId, values, isUnlocked]);

  const results = useMemo(() => {
    const computed: Record<string, number> = {};
    (outputs || []).forEach((out) => {
      if (!out?.variable) return;
      try {
        const calculated = evaluateFormula(out.formula || '0', values);
        computed[out.variable] = typeof calculated === 'number' && !isNaN(calculated) ? calculated : 0;
      } catch (_err) {
        computed[out.variable] = 0;
      }
    });
    return computed;
  }, [outputs, values]);

  const handleInputChange = (variable: string, val: number) => {
    setValues((prev) => ({
      ...prev,
      [variable]: isNaN(val) ? 0 : val
    }));
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Inserisci un indirizzo email valido.');
      return;
    }

    if (privacyPolicyUrl && !privacyAccepted) {
      setErrorMessage('È necessario accettare la privacy policy per procedere.');
      return;
    }

    setSubmitting(true);

    const leadPayload = {
      calculator_id: calculatorId || 'preview',
      contact_data: { fullName, email },
      calculation_state: { inputs: values, results }
    };

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload)
        });
      } catch (err) {
        console.error('Webhook error:', err);
      }
    }

    if (isValidUUID(calculatorId)) {
      try {
        await supabase.from('leads').insert([
          {
            calculator_id: calculatorId,
            contact_data: { fullName, email },
            calculation_state: { inputs: values, results }
          }
        ]);
      } catch (err) {
        console.error('Database lead insert error:', err);
      }
    }

    setSubmitting(false);

    if (postSubmitAction === 'redirect' && redirectUrl) {
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = redirectUrl;
        } else {
          window.location.href = redirectUrl;
        }
      } catch (_err) {
        window.location.href = redirectUrl;
      }
    } else {
      setIsUnlocked(true);
    }
  };

  const effectiveColor = primaryColor || '#00F0FF';

  return (
    <div
      ref={containerRef}
      className="w-full max-w-xl mx-auto rounded-2xl bg-[#0B0F17] border border-white/10 shadow-2xl p-6 md:p-8 space-y-6 text-slate-100 font-sans"
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/5 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00F59B] animate-pulse"></span>
          <span className="text-slate-300 font-bold uppercase tracking-wider">CALCFLOW // ENGINE v2.6</span>
        </div>
        <span className="text-slate-500 font-mono">STATUS: OPERATIONAL</span>
      </div>

      <div className="space-y-5">
        {(inputs || []).map((inp) => {
          if (!inp) return null;
          const val = values[inp.variable] ?? inp.defaultValue ?? 0;
          const min = typeof inp.min === 'number' ? inp.min : 0;
          const max = typeof inp.max === 'number' ? inp.max : 100;
          const range = max > min ? max - min : 1;
          const currentVal = Math.min(max, Math.max(min, val));
          const percentage = Math.min(100, Math.max(0, ((currentVal - min) / range) * 100));

          return (
            <div key={inp.id || inp.variable} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 uppercase tracking-wide">{inp.label || inp.variable}</span>
                <span
                  className="px-2.5 py-0.5 rounded bg-[#101623] border border-white/10 font-bold font-mono"
                  style={{ color: effectiveColor }}
                >
                  {inp.prefix} {formatSafeNumber(val)} {inp.suffix}
                </span>
              </div>

              {inp.type === 'slider' && (
                <div className="py-1">
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={inp.step ?? 1}
                    value={val}
                    onChange={(e) => handleInputChange(inp.variable, parseFloat(e.target.value) || 0)}
                    style={{
                      background: `linear-gradient(to right, ${effectiveColor} 0%, ${effectiveColor} ${percentage}%, #161E2E ${percentage}%, #161E2E 100%)`
                    }}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#00F0FF] focus:outline-none"
                  />
                </div>
              )}

              {inp.type === 'number' && (
                <div className="relative">
                  {inp.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                      {inp.prefix}
                    </span>
                  )}
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={inp.step ?? 1}
                    value={val}
                    onChange={(e) => handleInputChange(inp.variable, parseFloat(e.target.value) || 0)}
                    className={`w-full text-xs font-mono text-slate-100 p-2.5 rounded-lg border border-white/10 bg-[#101623] focus:outline-none transition ${
                      inp.prefix ? 'pl-7' : ''
                    } ${inp.suffix ? 'pr-10' : ''}`}
                    style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  {inp.suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                      {inp.suffix}
                    </span>
                  )}
                </div>
              )}

              {inp.type === 'select' && (
                <div className="relative">
                  <select
                    value={val}
                    onChange={(e) => handleInputChange(inp.variable, parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono text-slate-200 p-2.5 rounded-lg border border-white/10 bg-[#101623] focus:outline-none appearance-none pr-8 cursor-pointer"
                  >
                    {(inp.options || []).map((opt, i) => (
                      <option key={i} value={opt.value} className="bg-[#0B0F17] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">
                    ▼
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isUnlocked ? (
        <div className="pt-4 border-t border-white/10 space-y-3">
          {(outputs || []).map((out) => {
            if (!out) return null;
            const resultVal = results[out.variable] ?? 0;
            const isHighlighted = out.highlight;

            return (
              <div
                key={out.id || out.variable}
                className={`p-4 rounded-xl border transition-all ${
                  isHighlighted
                    ? 'bg-[#101623] border-[#00F0FF]/40 shadow-lg shadow-[#00F0FF]/5'
                    : 'bg-[#0E131E] border-white/5'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                    {out.label || out.variable}
                  </span>
                  {isHighlighted && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20">
                      PRIMARY
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black font-mono mt-1 text-[#00F59B] flex items-baseline gap-1">
                  {out.prefix && <span className="text-base text-[#00F59B]/60">{out.prefix}</span>}
                  <span className="tracking-tight">{formatSafeNumber(resultVal)}</span>
                  {out.suffix && <span className="text-xs text-slate-400 font-mono">{out.suffix}</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pt-4 border-t border-white/10">
          <form
            onSubmit={handleLeadSubmit}
            className="p-5 rounded-xl bg-[#101623] border border-white/10 space-y-4 text-center"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto text-base border"
              style={{
                backgroundColor: `${effectiveColor}15`,
                borderColor: `${effectiveColor}35`,
                color: effectiveColor
              }}
            >
              🔒
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Sblocco Calcolo &amp; Preventivo Riservato
              </h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Inserisci i dati aziendali per visualizzare la stima completa in tempo reale.
              </p>
            </div>

            {errorMessage && (
              <div className="p-2 text-xs bg-red-950/60 text-red-400 rounded border border-red-500/20 font-mono">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2.5 text-left">
              <input
                type="text"
                placeholder="Nome Referente o Azienda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-white/10 bg-[#0B0F17] text-slate-200 focus:outline-none"
              />

              <input
                type="email"
                required
                placeholder="azienda@dominio.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-white/10 bg-[#0B0F17] text-slate-200 focus:outline-none"
              />

              {privacyPolicyUrl && (
                <div className="flex items-start gap-2 pt-1 text-[10px] text-slate-400">
                  <input
                    type="checkbox"
                    id="cyber-privacy"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 rounded cursor-pointer accent-[#00F0FF]"
                  />
                  <label htmlFor="cyber-privacy" className="cursor-pointer leading-tight">
                    {privacyText}{' '}
                    <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="text-[#00F0FF] underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: effectiveColor }}
              className="w-full py-3 px-4 text-[#06080D] text-xs font-mono font-bold rounded-lg transition tracking-wider uppercase cursor-pointer disabled:opacity-50 hover:brightness-105 active:scale-[0.99]"
            >
              {submitting ? 'DECRYPTING DATA...' : 'DECRITTA & RIVELA RISULTATI ↗'}
            </button>
          </form>
        </div>
      )}

      <div className="pt-2 text-center">
        <a
          href="https://alcflow-saas-un1z.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 transition"
        >
          <span>POWERED BY</span>
          <span style={{ color: effectiveColor }} className="font-bold">
            CALCFLOW_TERMINAL
          </span>
        </a>
      </div>
    </div>
  );
}