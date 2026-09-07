'use client';

import React, { useState, useEffect, useMemo, useRef, useTransition } from 'react';
import Link from 'next/link';
import {
  evaluateFormula,
  CalculatorInput,
  CalculatorOutput
} from '@/lib/calculator-engine';
import { supabase } from '@/lib/supabase';

export interface TrackingMetadata {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  pageUrl?: string;
  deviceType?: string;
}

interface CalculatorPreviewProps {
  calculatorId?: string;
  inputs: CalculatorInput[];
  outputs: CalculatorOutput[];
  primaryColor?: string;
  enableLeadGate?: boolean;
  privacyPolicyUrl?: string;
  privacyText?: string;
  postSubmitAction?: 'unlock' | 'redirect';
  redirectUrl?: string;
  webhookUrl?: string;
  trackingData?: TrackingMetadata;
  showAdminBar?: boolean;
}

export default function CalculatorPreview({
  calculatorId = 'demo',
  inputs = [],
  outputs = [],
  primaryColor = '#4D7CFE',
  enableLeadGate = false,
  privacyPolicyUrl = '',
  privacyText = 'Dichiaro di aver letto e accetto la',
  postSubmitAction = 'unlock',
  redirectUrl = '',
  webhookUrl = '',
  trackingData = {},
  showAdminBar = false
}: CalculatorPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [, startTransition] = useTransition();

  const getInitialValues = () => {
    const init: Record<string, number> = {};
    inputs.forEach((inp) => {
      if (inp.variable) {
        init[inp.variable] = Number(inp.defaultValue ?? inp.min ?? 0);
      }
    });
    return init;
  };

  const [values, setValues] = useState<Record<string, number>>(getInitialValues);
  const [isUnlocked, setIsUnlocked] = useState(!enableLeadGate);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setValues((prev) => {
        const updated = { ...prev };
        inputs.forEach((inp) => {
          if (inp.variable && (updated[inp.variable] === undefined || isNaN(updated[inp.variable]))) {
            updated[inp.variable] = Number(inp.defaultValue ?? inp.min ?? 0);
          }
        });
        return updated;
      });
    });
    return () => window.clearTimeout(timeoutId);
  }, [inputs]);

  useEffect(() => {
    if (!enableLeadGate) {
      const timeoutId = window.setTimeout(() => setIsUnlocked(true));
      return () => window.clearTimeout(timeoutId);
    }
  }, [enableLeadGate]);

  useEffect(() => {
    const notifyHeight = () => {
      if (!containerRef.current) return;
      const height = containerRef.current.scrollHeight;
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'CALCFLOW_RESIZE',
            calculatorId,
            height
          },
          '*'
        );
      }
    };

    notifyHeight();
    const ro = new ResizeObserver(notifyHeight);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [calculatorId, isUnlocked, values]);

  const handleValueChange = (variable: string, val: number) => {
    setValues((prev) => ({ ...prev, [variable]: val }));

    if (!hasInteractedRef.current && calculatorId && calculatorId !== 'preview' && calculatorId !== 'demo') {
      hasInteractedRef.current = true;
      startTransition(async () => {
        await supabase.rpc('track_calculator_metric', {
          calc_id: calculatorId,
          metric_type: 'interaction'
        });
      });
    }
  };

  const calculatedOutputs = useMemo(() => {
    return outputs.map((out) => ({
      ...out,
      result: evaluateFormula(out.formula, values)
    }));
  }, [outputs, values]);

  const handleReset = () => {
    setValues(getInitialValues());
    if (enableLeadGate) {
      setIsUnlocked(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!privacyConsent) {
      setSubmitError('È necessario accettare i termini di privacy per procedere.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const numericResultsMap: Record<string, number> = {};
    calculatedOutputs.forEach((o) => {
      if (o.variable) numericResultsMap[o.variable] = o.result;
    });

    const leadPayload = {
      calculator_id: calculatorId,
      contact_data: {
        fullName: fullName.trim(),
        email: email.trim()
      },
      calculation_state: {
        inputs: values,
        results: numericResultsMap
      },
      page_url: trackingData.pageUrl || '',
      utm_source: trackingData.utmSource || '',
      utm_medium: trackingData.utmMedium || '',
      utm_campaign: trackingData.utmCampaign || '',
      device_type: trackingData.deviceType || 'desktop'
    };

    try {
      if (calculatorId && calculatorId !== 'demo' && calculatorId !== 'preview') {
        const { error } = await supabase.from('leads').insert([leadPayload]);
        if (error) throw error;
      }

      if (webhookUrl && webhookUrl.startsWith('http')) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'lead_captured',
              timestamp: new Date().toISOString(),
              ...leadPayload
            })
          });
        } catch {}
      }

      if (postSubmitAction === 'redirect' && redirectUrl && redirectUrl.startsWith('http')) {
        window.location.href = redirectUrl;
        return;
      }

      setIsUnlocked(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Errore durante la trasmissione del contatto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Barra di Ritorno in modalità Anteprima */}
      {showAdminBar && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F1422] border border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mint animate-ping" />
            <span className="font-mono text-white font-semibold">MODALITÀ ANTEPRIMA LIVE</span>
          </div>
          <Link
            href="/dashboard"
            className="font-mono font-bold text-accent-hi hover:text-white transition flex items-center gap-1.5"
          >
            ← Torna alla Dashboard
          </Link>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full rounded-2xl border border-white/10 bg-[#080C14] text-white p-6 sm:p-8 shadow-2xl transition-all"
        style={{ '--accent-theme': primaryColor } as React.CSSProperties}
      >
        {/* Intestazione widget preview */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 font-mono text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-widest uppercase">CALCFLOW</span>
            <span className="chip !py-0 !px-1.5 text-[9px]">ENGINE V2.6</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
            <span className="text-mint font-semibold uppercase tracking-wider">LIVE</span>
          </div>
        </div>

        {/* Lista Input */}
        <div className="space-y-6">
          {inputs.map((inp, idx) => {
            const currentVal = values[inp.variable] ?? inp.defaultValue ?? 0;
            return (
              <div key={inp.id || inp.variable} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-200">
                    <span className="text-slate-500 mr-2">{String(idx + 1).padStart(2, '0')}</span>
                    {inp.label}
                  </label>
                  <span className="font-mono text-xs font-bold text-white bg-raised px-2.5 py-1 rounded-md border border-white/10 tabular">
                    {inp.prefix || ''}{currentVal.toLocaleString('it-IT')}{inp.suffix ? ` ${inp.suffix}` : ''}
                  </span>
                </div>

                {inp.type === 'slider' ? (
                  <div className="relative flex items-center pt-1">
                    <input
                      type="range"
                      min={inp.min ?? 0}
                      max={inp.max ?? 100}
                      step={inp.step ?? 1}
                      value={currentVal}
                      onChange={(e) => handleValueChange(inp.variable, parseFloat(e.target.value) || 0)}
                      className="w-full h-2 rounded-lg bg-raised appearance-none cursor-pointer focus:outline-none"
                      style={{ accentColor: primaryColor }}
                    />
                  </div>
                ) : inp.type === 'select' ? (
                  <select
                    value={currentVal}
                    onChange={(e) => handleValueChange(inp.variable, Number(e.target.value))}
                    className="field field-mono text-sm !py-2.5 font-semibold"
                  >
                    {(inp.options || []).map((option) => (
                      <option key={`${inp.variable}-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="relative">
                    {inp.prefix && (
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
                        {inp.prefix}
                      </span>
                    )}
                    <input
                      type="number"
                      min={inp.min}
                      max={inp.max}
                      step={inp.step ?? 1}
                      value={currentVal}
                      onChange={(e) => handleValueChange(inp.variable, parseFloat(e.target.value) || 0)}
                      className={`field field-mono text-sm !py-2.5 font-semibold ${inp.prefix ? '!pl-8' : ''}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sezione Lead Gate o Risultati */}
        <div className="mt-8 pt-6 border-t border-white/10">
          {enableLeadGate && !isUnlocked ? (
            <div className="p-6 rounded-xl border border-white/10 bg-[#0C1019] space-y-4">
              <div className="space-y-1 text-center">
                <h4 className="text-base font-bold text-white">Risultati Riservati</h4>
                <p className="text-xs text-slate-400">
                  Lascia i tuoi riferimenti per visualizzare la stima completa in tempo reale.
                </p>
              </div>

              {submitError && (
                <div className="p-3 bg-rose/10 border border-rose/30 text-rose font-mono text-xs rounded-lg">
                  ✕ {submitError}
                </div>
              )}

              <form onSubmit={handleLeadSubmit} className="space-y-3.5">
                <div>
                  <input
                    type="text"
                    placeholder="Nome e Cognome / Azienda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="field text-xs font-medium"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    required
                    placeholder="nome@azienda.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field text-xs font-medium"
                  />
                </div>

                <label className="flex items-start gap-2.5 text-[11px] text-slate-300 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    required
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 bg-raised accent-accent mt-0.5 cursor-pointer flex-none"
                  />
                  <span className="leading-tight">
                    {privacyText}{' '}
                    {privacyPolicyUrl ? (
                      <a
                        href={privacyPolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-accent-hi hover:text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        privacy policy
                      </a>
                    ) : (
                      <span className="underline">privacy policy</span>
                    )}
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-full !py-3 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting ? 'Elaborazione…' : 'SBLOCCA I RISULTATI ↗'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
                  Proiezione Calcolata
                </span>
                <div className="flex items-center gap-2">
                  <span className="badge badge-mint">Certificato</span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] font-mono text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    ↺ Ricalcola
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {calculatedOutputs.map((out) => (
                  <div
                    key={out.id || out.variable}
                    className={`p-4 rounded-xl border transition ${
                      out.highlight
                        ? 'border-accent/40 bg-accent/[0.08] text-white shadow-md'
                        : 'border-white/10 bg-[#0C1019] text-slate-200'
                    }`}
                  >
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">
                      {out.label}
                    </span>
                    <div className="font-mono text-2xl font-extrabold tracking-tight tabular text-white">
                      {out.prefix || ''}
                      {out.result.toLocaleString('it-IT', { maximumFractionDigits: 2 })}
                      {out.suffix ? ` ${out.suffix}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}