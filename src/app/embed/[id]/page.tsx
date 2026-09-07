'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CalculatorPreview from '@/components/CalculatorPreview';
import { CalculatorInput, CalculatorOutput } from '@/lib/calculator-engine';

interface EmbedCalculator {
  id: string;
  title: string;
  inputs?: CalculatorInput[];
  outputs?: CalculatorOutput[];
  config?: {
    inputs?: CalculatorInput[];
    outputs?: CalculatorOutput[];
  };
  primary_color: string;
  enable_lead_gate: boolean;
  privacy_policy_url: string;
  privacy_text: string;
  post_submit_action: 'unlock' | 'redirect';
  redirect_url: string;
  webhook_url: string;
  is_published: boolean;
}

export default function StandaloneEmbedPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [calc, setCalc] = useState<EmbedCalculator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [trackingData, setTrackingData] = useState({
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    pageUrl: '',
    deviceType: 'desktop'
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    let device = 'desktop';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      device = 'tablet';
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) {
      device = 'mobile';
    }

    const utmSource = searchParams.get('utm_source') || '';
    const utmMedium = searchParams.get('utm_medium') || '';
    const utmCampaign = searchParams.get('utm_campaign') || '';
    const pageUrl = document.referrer || (typeof window !== 'undefined' ? window.location.href : '');

    setTrackingData({
      utmSource,
      utmMedium,
      utmCampaign,
      pageUrl,
      deviceType: device
    });

    async function fetchEmbedCalc() {
      if (!id) return;
      setLoading(true);

      const { data, error: dbError } = await supabase
        .from('calculators')
        .select('*')
        .eq('id', id)
        .single();

      if (dbError || !data) {
        setError('Terminale di calcolo non trovato.');
      } else if (!data.is_published) {
        setError('Questo terminale di calcolo è temporaneamente in pausa.');
      } else {
        setCalc(data as EmbedCalculator);

        startTransition(async () => {
          await supabase.rpc('track_calculator_metric', {
            calc_id: id,
            metric_type: 'view'
          });
        });
      }

      setLoading(false);
    }

    fetchEmbedCalc();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center p-4">
        <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-3" />
        <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
          Caricamento Terminale…
        </p>
      </div>
    );
  }

  if (error || !calc) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center p-4 text-white">
        <div className="panel p-6 border-white/10 text-center font-mono text-xs text-rose">
          ✕ {error || 'Terminale non disponibile.'}
        </div>
      </div>
    );
  }

  // Risolve gli input e gli output sia dal nuovo schema che dal campo config legacy
  const resolvedInputs = calc.inputs?.length ? calc.inputs : (calc.config?.inputs || []);
  const resolvedOutputs = calc.outputs?.length ? calc.outputs : (calc.config?.outputs || []);

  return (
    <div className="min-h-screen bg-[#080C14] p-2 sm:p-6 flex items-center justify-center">
      <CalculatorPreview
        calculatorId={calc.id}
        inputs={resolvedInputs}
        outputs={resolvedOutputs}
        primaryColor={calc.primary_color || '#4D7CFE'}
        enableLeadGate={calc.enable_lead_gate ?? true}
        privacyPolicyUrl={calc.privacy_policy_url || ''}
        privacyText={calc.privacy_text || 'Dichiaro di aver letto e accetto la'}
        postSubmitAction={calc.post_submit_action || 'unlock'}
        redirectUrl={calc.redirect_url || ''}
        webhookUrl={calc.webhook_url || ''}
        trackingData={trackingData}
      />
    </div>
  );
}