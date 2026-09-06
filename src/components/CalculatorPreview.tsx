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

function useAnimatedNumber(target: number, duration = 520): number {
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

function IconArrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor"
      strokeWidth="1.5" className={className} aria-hidden="true">
      <path d="M2 10 10 2M3.8 2H10v6.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevron({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="currentColor"
      strokeWidth="1.5" className={className} aria-hidden="true">
      <path d="m1 1 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="1.5" aria-hidden="true">
      <rect x="4" y="9" width="12" height="8" rx="1.5" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" strokeLinecap="round" />
      <circle cx="10" cy="13" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Mark({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 1.5 18 6v8l-8 4.5L2 14V6l8-4.5Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 1.5V10m0 0 8-4m-8 4-8-4" stroke={color} strokeWidth="1.4" strokeLinejoin="round" opacity="0.55" />
      <path d="M10 10v8.5L18 14V6" fill={color} fillOpacity="0.14" stroke="none" />
    </svg>
  );
}

function ResultRow({
  label, value, prefix, suffix
}: {
  label: string; value: number; prefix?: string; suffix?: string;
}) {
  const display = useAnimatedNumber(value);
  return (
    <div className="flex items-baseline py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <span className="leader" />
      <span className="font-mono tabular text-[15px] font-semibold text-ink flex-none">
        {prefix && <span className="text-faint font-normal mr-1">{prefix}</span>}
        {formatSafeNumber(display)}
        {suffix && <span className="text-faint font-normal ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

function ResultPrimary({
  label, value, prefix, suffix
}: {
  label: string; value: number; prefix?: string; suffix?: string;
}) {
  const display = useAnimatedNumber(value, 650);
  return (
    <div className="relative p-4 rounded-xl border border-line-accent bg-accent/[0.06] overflow-hidden">
      <div className="edge-light" />
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          {label}
        </span>
        <span className="badge badge-accent">Primary</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        {prefix && <span className="font-mono text-base text-faint">{prefix}</span>}
        <span className="font-mono tabular text-[2.1rem] sm:text-[2.4rem] leading-none font-bold text-mint"
          style={{ textShadow: '0 0 28px rgba(44,224,165,0.35)' }}>
          {formatSafeNumber(display)}
        </span>
        {suffix && <span className="font-mono text-[11px] text-faint">{suffix}</span>}
      </div>
    </div>
  );
}

export default function CalculatorPreview({
  calculatorId = null,
  inputs = [],
  outputs = [],
  primaryColor = '#4D7CFE',
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

  const [latency, setLatency] = useState(14);
  useEffect(() => {
    const id = window.setInterval(() => {
      setLatency(11 + Math.floor(Math.random() * 8));
    }, 1900);
    return () => window.clearInterval(id);
  }, []);

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

  const effectiveColor = primaryColor || '#4D7CFE';
  const protocol = calculatorId
    ? calculatorId.replace(/-/g, '').slice(0, 8).toUpperCase()
    : 'ANTEPRIMA';

  return (
    <div ref={containerRef} className="w-full max-w-xl mx-auto font-sans text-ink">
      <div className="relative panel overflow-hidden shadow-[0_24px_70px_-24px_rgba(0,0,0,0.8)]">
        <div className="edge-light" />

        {/* Barra titolo del terminale */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 h-11 border-b border-line bg-white/[0.02]">
          <div className="flex items-center gap-2.5 min-w-0">
            <Mark color={effectiveColor} size={16} />
            <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-ink truncate">
              CALCFLOW
            </span>
            <span className="hidden sm:inline chip !py-0.5 !px-1.5 !text-[8px]">
              ENGINE v2.6
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[9px] tracking-[0.14em]">
            <span className="hidden sm:inline text-faint tabular">LAT {latency}MS</span>
            <span className="inline-flex items-center gap-1.5 text-mint">
              <span className="dot-live" />
              LIVE
            </span>
          </div>
        </div>

        {/* Parametri di input */}
        <div className="px-4 sm:px-5 py-5 space-y-5">
          {(inputs || []).map((inp, idx) => {
            if (!inp) return null;
            const val = values[inp.variable] ?? inp.defaultValue ?? 0;
            const min = typeof inp.min === 'number' ? inp.min : 0;
            const max = typeof inp.max === 'number' ? inp.max : 100;
            const range = max > min ? max - min : 1;
            const currentVal = Math.min(max, Math.max(min, val));
            const percentage = Math.min(100, Math.max(0, ((currentVal - min) / range) * 100));

            return (
              <div key={inp.id || inp.variable} className="anim-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                <div className="flex items-center justify-between gap-4">
                  <label className="text-[13px] font-medium text-ink/90 flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[9px] text-faint flex-none">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate">{inp.label || inp.variable}</span>
                  </label>
                  <span
                    className="font-mono tabular text-[11px] font-semibold px-2 py-1 rounded-md border bg-raised flex-none"
                    style={{
                      color: effectiveColor,
                      borderColor: `${effectiveColor}44`,
                      background: `${effectiveColor}0F`
                    }}
                  >
                    {inp.prefix && <span className="opacity-50 mr-0.5">{inp.prefix}</span>}
                    {formatSafeNumber(val)}
                    {inp.suffix && <span className="opacity-50 ml-0.5">{inp.suffix}</span>}
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
                        background: `linear-gradient(to right, ${effectiveColor} 0%, ${effectiveColor} ${percentage}%, #1B2434 ${percentage}%, #1B2434 100%)`
                      }}
                      className="slider"
                    />
                    <div className="flex justify-between mt-1.5 font-mono text-[9px] text-faint tabular">
                      <span>{formatSafeNumber(min)}{inp.suffix ? ` ${inp.suffix}` : ''}</span>
                      <span>{formatSafeNumber(max)}{inp.suffix ? ` ${inp.suffix}` : ''}</span>
                    </div>
                  </div>
                )}

                {inp.type === 'number' && (
                  <div className="relative mt-2.5">
                    {inp.prefix && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-faint pointer-events-none">
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
                      className={`field field-mono ${inp.prefix ? 'pl-7' : ''} ${inp.suffix ? 'pr-12' : ''}`}
                    />
                    {inp.suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-faint pointer-events-none">
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
                      className="field field-mono"
                    >
                      {(inp.options || []).map((opt, i) => (
                        <option key={i} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <IconChevron className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-faint" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Output */}
        {isUnlocked ? (
          <div key="results" className="anim-slide-in">
            <div className="border-t border-line" />
            <div className="px-4 sm:px-5 py-5 space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  Risultati <span className="text-faint">// tempo reale</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-mint">
                  <span className="dot-live" />
                  Sync attivo
                </span>
              </div>

              {(outputs || []).length === 0 ? (
                <p className="py-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  Nessuna voce di risultato configurata
                </p>
              ) : (
                <>
                  {(outputs || []).map((out) => {
                    if (!out) return null;
                    const resultVal = results[out.variable] ?? 0;
                    const safe = typeof resultVal === 'number' && !isNaN(resultVal) ? resultVal : 0;

                    return out.highlight ? (
                      <ResultPrimary
                        key={out.id || out.variable}
                        label={out.label || out.variable}
                        value={safe}
                        prefix={out.prefix}
                        suffix={out.suffix}
                      />
                    ) : (
                      <div key={out.id || out.variable} className="divide-y divide-line">
                        <ResultRow
                          label={out.label || out.variable}
                          value={safe}
                          prefix={out.prefix}
                          suffix={out.suffix}
                        />
                      </div>
                    );
                  })}
                </>
              )}

              <p className="pt-1 font-mono text-[9px] leading-relaxed tracking-wide text-faint">
                Stima generata in tempo reale a puro valore indicativo. Non costituisce offerta contrattuale.
              </p>
            </div>
          </div>
        ) : (
          <div key="gate" className="anim-slide-in">
            <div className="border-t border-line" />
            <div className="px-4 sm:px-5 py-6">
              <div className="relative rounded-xl border border-line bg-raised/60 p-5 sm:p-6 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg border flex items-center justify-center flex-none"
                    style={{
                      borderColor: `${effectiveColor}44`,
                      background: `${effectiveColor}12`,
                      color: effectiveColor
                    }}
                  >
                    <IconLock />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-ink leading-snug">
                      Risultati riservati
                    </h4>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      Lascia i tuoi riferimenti per sbloccare la stima completa
                      con tutte le voci analitiche.
                    </p>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-4 rounded-lg border border-rose/30 bg-rose/[0.07] px-3.5 py-2.5 font-mono text-[11px] text-rose anim-pop">
                    <span className="mr-1.5">✕</span>{errorMessage}
                  </div>
                )}

                <form onSubmit={handleLeadSubmit} className="mt-5 space-y-3.5">
                  <div>
                    <label htmlFor="cf-name" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-faint mb-1.5">
                      Nome / Azienda
                    </label>
                    <input
                      id="cf-name"
                      type="text"
                      placeholder="Mario Rossi — Azienda S.p.A."
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="field"
                    />
                  </div>

                  <div>
                    <label htmlFor="cf-email" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-faint mb-1.5">
                      Email aziendale
                    </label>
                    <input
                      id="cf-email"
                      type="email"
                      required
                      placeholder="nome@azienda.it"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="field field-mono"
                    />
                  </div>

                  {privacyPolicyUrl && (
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="cf-privacy"
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                        className="checkbox"
                      />
                      <label htmlFor="cf-privacy" className="text-[11px] leading-relaxed text-muted cursor-pointer select-none">
                        {privacyText}{' '}
                        <a
                          href={privacyPolicyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link"
                        >
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ background: `linear-gradient(180deg, ${effectiveColor}, ${effectiveColor}CC)` }}
                    className="btn w-full !text-white shadow-[0_8px_24px_-8px_rgba(77,124,254,0.5)] hover:brightness-110"
                  >
                    {submitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Trasmissione…
                      </>
                    ) : (
                      <>
                        Sblocca i risultati
                        <IconArrow />
                      </>
                    )}
                  </button>

                  <p className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                    Nessuna registrazione · Risposta immediata
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Footer del terminale */}
        <div className="border-t border-line px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 bg-white/[0.015]">
          <a
            href="https://alcflow-saas-un1z.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-faint hover:text-muted transition-colors"
          >
            Powered by
            <span className="font-bold" style={{ color: effectiveColor }}>CALCFLOW</span>
            <IconArrow className="opacity-60" />
          </a>
          <span className="font-mono text-[9px] tracking-[0.14em] text-faint">
            PROT. {protocol}
          </span>
        </div>
      </div>
    </div>
  );
}