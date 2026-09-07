'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CalculatorBuilder, { CalculatorData } from '@/components/CalculatorBuilder';

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [calcData, setCalcData] = useState<CalculatorData | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      if (editId) {
        const { data, error } = await supabase
          .from('calculators')
          .select('*')
          .eq('id', editId)
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          setErrorMessage('Impossibile caricare il calcolatore specificato.');
        } else {
          setCalcData({
            id: data.id,
            title: data.title || 'Terminale di Stima',
            inputs: data.inputs || data.config?.inputs || [],
            outputs: data.outputs || data.config?.outputs || [],
            primaryColor: data.primary_color || '#4D7CFE',
            enableLeadGate: data.enable_lead_gate ?? true,
            privacyPolicyUrl: data.privacy_policy_url || '',
            privacyText: data.privacy_text || 'Dichiaro di aver letto e accetto la',
            postSubmitAction: data.post_submit_action || 'unlock',
            redirectUrl: data.redirect_url || '',
            webhookUrl: data.webhook_url || '',
            isPublished: data.is_published ?? true
          });
        }
      }

      setLoading(false);
    }

    loadData();
  }, [editId, router]);

  const handleSave = async (data: CalculatorData) => {
    if (!userId) return;
    setSaving(true);
    setErrorMessage(null);

    // Mappa identica allo schema rilevato nelle tue colonne
    const payload = {
      user_id: userId,
      title: data.title,
      inputs: data.inputs,
      outputs: data.outputs,
      config: {
        inputs: data.inputs,
        outputs: data.outputs
      },
      primary_color: data.primaryColor,
      enable_lead_gate: Boolean(data.enableLeadGate),
      privacy_policy_url: data.privacyPolicyUrl || '',
      privacy_text: data.privacyText || 'Dichiaro di aver letto e accetto la',
      post_submit_action: data.postSubmitAction || 'unlock',
      redirect_url: data.redirectUrl || '',
      webhook_url: data.webhookUrl || '',
      is_published: Boolean(data.isPublished)
    };

    try {
      if (editId) {
        const { error } = await supabase
          .from('calculators')
          .update(payload)
          .eq('id', editId)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from('calculators')
          .insert([payload])
          .select('id')
          .single();

        if (error) throw error;
        if (inserted?.id) {
          router.push(`/dashboard/builder?id=${inserted.id}`);
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore durante il salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest text-faint">
          Inizializzazione Editor…
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-xs font-mono text-faint hover:text-ink transition">
          ← Torna alla dashboard
        </Link>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg border border-rose/30 bg-rose/[0.07] font-mono text-xs text-rose">
          ✕ {errorMessage}
        </div>
      )}

      <CalculatorBuilder
        initialData={calcData}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-void text-ink p-5 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[50vh] font-mono text-xs text-faint">
              Inizializzazione…
            </div>
          }
        >
          <BuilderContent />
        </Suspense>
      </div>
    </div>
  );
}