'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CalculatorPreview from '@/components/CalculatorPreview';
import { CalculatorInput, CalculatorOutput } from '@/lib/calculator-engine';

export default function EmbedPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [config, setConfig] = useState<{
    inputs: CalculatorInput[];
    outputs: CalculatorOutput[];
    primaryColor: string;
    enableLeadGate: boolean;
    privacyPolicyUrl?: string;
    privacyText?: string;
    postSubmitAction?: 'unlock' | 'redirect';
    redirectUrl?: string;
    webhookUrl?: string;
  } | null>(null);

  useEffect(() => {
    async function loadCalculator() {
      if (!id) return;

      const { data, error } = await supabase
        .from('calculators')
        .select('config')
        .eq('id', id)
        .single();

      if (error || !data) {
        setError(true);
      } else {
        setConfig(data.config);
      }
      setLoading(false);
    }

    loadCalculator();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] bg-transparent">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        Calcolatore non trovato o non pubblicato.
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent flex justify-center items-start p-2">
      <div className="w-full max-w-xl">
        <CalculatorPreview
          calculatorId={id}
          inputs={config.inputs}
          outputs={config.outputs}
          primaryColor={config.primaryColor}
          enableLeadGate={config.enableLeadGate}
          privacyPolicyUrl={config.privacyPolicyUrl}
          privacyText={config.privacyText}
          postSubmitAction={config.postSubmitAction}
          redirectUrl={config.redirectUrl}
          webhookUrl={config.webhookUrl}
        />
      </div>
    </div>
  );
}