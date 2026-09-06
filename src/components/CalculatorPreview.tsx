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

/* =========================================================================
   ANIMAZIONE NUMERICA — transizione fluida con curva cubica
   ========================================================================= */
function useAnimatedNumber(target: number, duration = 550): number {
  const [display, setDisplay] = useState<number>(target);
  const displayRef = useRef<number>(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }
    const from = displayRef.current;
    if (from === target) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      displayRef.current = v;
      setDisplay(v);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

function ResultRow({
  label,
  value,
  prefix,
  suffix,
  highlighted
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  highlighted?: boolean;
}) {
  const display = useAnimatedNumber(value);

  if (highlighted) {
    return (
      <div className="py-5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            {label}
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-forest border border-forest/40 px-1.5 py-px">
            Principale
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          {prefix && <span className="display text-xl text-ink-faint">{prefix}</span>}
          <span className="display text-[2.6rem] sm:text-5xl leading-none font-semibold text-forest">
            {formatSafeNumber(display)}
          </span>
          {suffix && <span className="font-mono text-[11px] text-ink-faint">{suffix}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="py-3.5 flex items-baseline">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </span>
      <span className="leader" />
      <span className="font-mono text-sm font-semibold text-ink flex-none">
        {prefix && <span className="text-ink-faint font-normal mr-1">{prefix}</span>}
        {formatSafeNumber(display)}
        {suffix && <span className="text-ink-faint font-normal ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 10 10 2M3.8 2H10v6.2" />
    </svg>
  );
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 6"
      width="10"
      height="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className}
      aria-hidden="true"
    >
      <path d="m1 1 4 4 4-4" />
    </svg>
  );
}

export default function CalculatorPreview({
  calculatorId = null,
  inputs = [],
  outputs = [],
  primaryColor = '#1E4D3B',
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

  const effectiveColor = primaryColor || '#1E4D3B';
  const protocol = calculatorId
    ? calculatorId.replace(/-/g, '').slice(0, 8).toUpperCase()
    : 'ANTEPRIMA';

  return (
    <div ref={containerRef} className="w-full max-w-xl mx-auto font-sans text-ink">
      <div className="relative bg-paper-raised border border-ink/25 shadow-[8px_8px_0_0_rgba(31,29,24,0.08)]">

        {/* Intestazione del documento */}
        <div className="px-5 sm:px-7 pt-5">
          <div className="flex items-center justify-between gap-4 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-1.5 h-1.5 rounded-full flex-none"
                style={{ backgroundColor: effectiveColor }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft truncate">
                Modulo di stima interattivo
              </span>
            </div>
            <span className="font-mono text-[10px] tracking-[0.14em] text-ink-faint flex-none">
              N. {protocol}
            </span>
          </div>
          <div className="border-b-4 border-double border-ink/40" />
        </div>

        {/* Parametri */}
        <div className="px-5 sm:px-7 py-6 space-y-6">
          {(inputs || []).map((inp, idx) => {
            if (!inp) return null;
            const val = values[inp.variable] ?? inp.defaultValue ?? 0;
            const min = typeof inp.min === 'number' ? inp.min : 0;
            const max = typeof inp.max === 'number' ? inp.max : 100;
            const range = max > min ? max - min : 1;
            const currentVal = Math.min(max, Math.max(min, val));
            const percentage = Math.min(100, Math.max(0, ((currentVal - min) / range) * 100));

            return (
              <div key={inp.id || inp.variable}>
                <div className="flex items-baseline justify-between gap-4">
                  <label className="text-[13px] font-medium text-ink">
                    <span className="font-mono text-[10px] text-ink-faint mr-2">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {inp.label || inp.variable}
                  </label>
                  <span
                    className="font-mono text-[11px] font-semibold px-2 py-0.5 border bg-paper flex-none"
                    style={{ color: effectiveColor, borderColor: `${effectiveColor}55` }}
                  >
                    {inp.prefix && <span className="opacity-60 mr-0.5">{inp.prefix}</span>}
                    {formatSafeNumber(val)}
                    {inp.suffix && <span className="opacity-60 ml-0.5">{inp.suffix}</span>}
                  </span>
                </div>

                {inp.type === 'slider' && (
                  <div className="mt-3">
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={inp.step ?? 1}
                      value={val}
                      aria-label={inp.label || inp.variable}
                      onChange={(e) => handleInputChange(inp.variable, parseFloat(e.target.value) || 0)}
                      style={{
                        background: `linear-gradient(to right, ${effectiveColor} 0%, ${effectiveColor} ${percentage}%, rgba(31,29,24,0.16) ${percentage}%, rgba(31,29,24,0.16) 100%)`
                      }}
                      className="slider-ink w-full"
                    />
                    <div className="flex justify-between mt-1.5 font-mono text-[9px] text-ink-faint tracking-wide">
                      <span>{min}{inp.suffix ? ` ${inp.suffix}` : ''}</span>
                      <span>{max}{inp.suffix ? ` ${inp.suffix}` : ''}</span>
                    </div>
                  </div>
                )}

                {inp.type === 'number' && (
                  <div className="relative mt-2.5">
                    {inp.prefix && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-faint pointer-events-none">
                        {inp.prefix}
                      </span>
                    )}
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={inp.step ?? 1}
                      value={val}
                      aria-label={inp.label || inp.variable}
                      onChange={(e) => handleInputChange(inp.variable, parseFloat(e.target.value) || 0)}
                      className={`field-ink ${inp.prefix ? 'pl-7' : ''} ${inp.suffix ? 'pr-12' : ''}`}
                    />
                    {inp.suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-faint pointer-events-none">
                        {inp.suffix}
                      </span>
                    )}
                  </div>
                )}

                {inp.type === 'select' && (
                  <div className="relative mt-2.5">
                    <select
                      value={val}
                      aria-label={inp.label || inp.variable}
                      onChange={(e) => handleInputChange(inp.variable, parseFloat(e.target.value) || 0)}
                      className="field-ink appearance-none pr-9 cursor-pointer"
                    >
                      {(inp.options || []).map((opt, i) => (
                        <option key={i} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-faint" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isUnlocked ? (
          /* Sezione risultati: registro analitico */
          <div className="px-5 sm:px-7 pb-7">
            <div className="border-t-4 border-double border-ink/40 pt-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                  Risultato del calcolo
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
                  <span className="w-1 h-1 rounded-full bg-forest" />
                  In tempo reale
                </span>
              </div>

              {(outputs || []).length === 0 ? (
                <p className="py-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                  Nessuna voce di risultato configurata.
                </p>
              ) : (
                <div className="divide-y divide-hairline">
                  {(outputs || []).map((out) => {
                    if (!out) return null;
                    const resultVal = results[out.variable] ?? 0;
                    return (
                      <ResultRow
                        key={out.id || out.variable}
                        label={out.label || out.variable}
                        value={typeof resultVal === 'number' && !isNaN(resultVal) ? resultVal : 0}
                        prefix={out.prefix}
                        suffix={out.suffix}
                        highlighted={out.highlight}
                      />
                    );
                  })}
                </div>
              )}

              <p className="mt-4 font-mono text-[9px] leading-relaxed tracking-wide text-ink-faint">
                Stima generata in tempo reale a puro valore indicativo: non costituisce offerta contrattuale.
              </p>
            </div>
          </div>
        ) : (
          /* Lead Gate: busta riservata con timbro */
          <div className="px-5 sm:px-7 pb-7">
            <div className="relative border border-ink/30 bg-paper px-5 sm:px-8 py-8 text-center outline outline-1 outline-offset-[-6px] outline-ink/10">
              <span className="stamp absolute -top-3.5 right-5 -rotate-2 bg-paper-raised text-seal">
                Riservato
              </span>

              <h4 className="display text-xl sm:text-2xl text-ink">
                La stima completa è riservata.
              </h4>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-soft max-w-sm mx-auto">
                Lascia i tuoi riferimenti: la versione dettagliata del calcolo,
                con tutte le voci analitiche, si sblocca immediatamente.
              </p>

              {errorMessage && (
                <div className="mt-5 border border-seal/40 bg-seal/[0.06] px-3.5 py-2.5 font-mono text-[11px] text-seal text-left">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleLeadSubmit} className="mt-6 space-y-4 text-left">
                <div>
                  <label
                    htmlFor="cf-fullname"
                    className="block font-mono text-[9px] uppercase tracking-[0.22em] text-ink-soft mb-1.5"
                  >
                    Nome e cognome
                  </label>
                  <input
                    id="cf-fullname"
                    type="text"
                    placeholder="Mario Rossi — Azienda S.p.A."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="field-ink"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cf-email"
                    className="block font-mono text-[9px] uppercase tracking-[0.22em] text-ink-soft mb-1.5"
                  >
                    Indirizzo e-mail
                  </label>
                  <input
                    id="cf-email"
                    type="email"
                    required
                    placeholder="nome@azienda.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-ink"
                  />
                </div>

                {privacyPolicyUrl && (
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="cf-privacy"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="checkbox-ink"
                    />
                    <label htmlFor="cf-privacy" className="text-[11px] leading-relaxed text-ink-soft cursor-pointer">
                      {privacyText}{' '}
                      <a
                        href={privacyPolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-forest underline underline-offset-2 hover:text-forest-deep"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                )}

                <button type="submit" disabled={submitting} className="btn btn-forest w-full">
                  {submitting ? 'Trasmissione in corso…' : 'Sblocca la stima completa'}
                  {!submitting && <ArrowIcon />}
                </button>

                <p className="text-center font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
                  Risposta immediata · Nessuna iscrizione richiesta
                </p>
              </form>
            </div>
          </div>
        )}

        {/* Colophon */}
        <div className="border-t border-hairline px-5 sm:px-7 py-3 flex items-center justify-between gap-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
            Motore di stima{' '}
            <a
              href="https://alcflow-saas-un1z.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-forest hover:underline underline-offset-2"
            >
              CalcFlow
            </a>
          </span>
          <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">v2.6</span>
        </div>
      </div>
    </div>
  );
}