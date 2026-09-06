'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CalculatorPreview from '@/components/CalculatorPreview';
import UserAvatar from '@/components/UserAvatar';
import { CalculatorInput, CalculatorOutput } from '@/lib/calculator-engine';
import { supabase } from '@/lib/supabase';

export default function CalculatorBuilder() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [existingCalculatorsCount, setExistingCalculatorsCount] = useState(0);

  const [title, setTitle] = useState('Preventivatore Servizi');
  const [isPublished, setIsPublished] = useState(true);
  const [inputs, setInputs] = useState<CalculatorInput[]>([
    { id: '1', variable: 'clienti', type: 'slider', label: 'Clienti Mensili', defaultValue: 50, min: 10, max: 500, step: 5 },
    { id: '2', variable: 'ticket_medio', type: 'number', label: 'Scontrino Medio', defaultValue: 80, min: 1, max: 2000, step: 1, prefix: '€' },
    {
      id: '3',
      variable: 'moltiplicatore_piano',
      type: 'select',
      label: 'Livello Servizio',
      defaultValue: 1,
      options: [
        { label: 'Standard', value: 1 },
        { label: 'Business (+25%)', value: 1.25 },
        { label: 'Enterprise (+50%)', value: 1.5 }
      ]
    }
  ]);

  const [outputs, setOutputs] = useState<CalculatorOutput[]>([
    {
      id: '1',
      variable: 'fatturato',
      label: 'Fatturato Mensile Stimato',
      formula: 'clienti * ticket_medio * moltiplicatore_piano',
      prefix: '€'
    },
    {
      id: '2',
      variable: 'tariffa_scontata',
      label: 'Tariffa Finale (Sconto Volume se > 100 clienti)',
      formula: 'clienti > 100 ? (clienti * ticket_medio * 0.9) : (clienti * ticket_medio)',
      prefix: '€',
      highlight: true
    }
  ]);

  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [enableLeadGate, setEnableLeadGate] = useState(true);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');
  const [privacyText, setPrivacyText] = useState('Dichiaro di aver letto e accetto la');
  const [postSubmitAction, setPostSubmitAction] = useState<'unlock' | 'redirect'>('unlock');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const [calculatorId, setCalculatorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'link' | 'iframe' | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Lettura piano utente
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      if (profile?.plan) {
        setUserPlan(profile.plan as 'free' | 'pro');
      }

      // Conteggio calcolatori creati
      const { count } = await supabase
        .from('calculators')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setExistingCalculatorsCount(count || 0);
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const idFromUrl = searchParams.get('id');

    if (idFromUrl) {
      loadCalculatorFromDatabase(idFromUrl);
    }
  }, []);

  const loadCalculatorFromDatabase = async (id: string) => {
    setLoadingExisting(true);
    const { data, error } = await supabase
      .from('calculators')
      .select('*')
      .eq('id', id)
      .single();

    setLoadingExisting(false);

    if (error || !data) {
      console.error('Errore caricamento:', error);
      alert('Impossibile caricare il calcolatore richiesto.');
      return;
    }

    setCalculatorId(data.id);
    setTitle(data.title || 'Calcolatore');
    setIsPublished(data.is_published ?? true);

    if (data.config) {
      setInputs(data.config.inputs || []);
      setOutputs(data.config.outputs || []);
      setPrimaryColor(data.config.primaryColor || '#2563eb');
      setEnableLeadGate(data.config.enableLeadGate ?? true);
      setPrivacyPolicyUrl(data.config.privacyPolicyUrl || '');
      setPrivacyText(data.config.privacyText || 'Dichiaro di aver letto e accetto la');
      setPostSubmitAction(data.config.postSubmitAction || 'unlock');
      setRedirectUrl(data.config.redirectUrl || '');
      setWebhookUrl(data.config.webhookUrl || '');
    }
  };

  const handleSaveOrUpdate = async () => {
    if (!currentUser) {
      alert('Effettua prima il login.');
      router.push('/login');
      return;
    }

    // Paywall Check: blocco per account Free oltre 1 calcolatore
    if (!calculatorId && userPlan === 'free' && existingCalculatorsCount >= 1) {
      setShowUpgradeModal(true);
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const configPayload = {
      inputs,
      outputs,
      primaryColor,
      enableLeadGate,
      privacyPolicyUrl,
      privacyText,
      postSubmitAction,
      redirectUrl,
      webhookUrl
    };

    if (calculatorId) {
      const { error } = await supabase
        .from('calculators')
        .update({
          title,
          is_published: isPublished,
          config: configPayload,
          updated_at: new Date().toISOString()
        })
        .eq('id', calculatorId)
        .eq('user_id', currentUser.id);

      setSaving(false);

      if (error) {
        console.error('Errore update:', error);
        alert("Errore durante l'aggiornamento.");
      } else {
        setStatusMessage('Modifiche salvate con successo!');
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } else {
      const { data, error } = await supabase
        .from('calculators')
        .insert([
          {
            user_id: currentUser.id,
            title,
            is_published: isPublished,
            config: configPayload
          }
        ])
        .select('id')
        .single();

      setSaving(false);

      if (data && !error) {
        setCalculatorId(data.id);
        setExistingCalculatorsCount((prev) => prev + 1);
        const newUrl = `${window.location.pathname}?id=${data.id}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
        setShowShareModal(true);
      } else {
        console.error('Errore insert:', error);
        alert('Errore durante il salvataggio su Supabase.');
      }
    }
  };

  const handleDelete = async () => {
    if (!calculatorId || !currentUser) return;
    const confirmDelete = window.confirm(
      'Sei sicuro di voler eliminare questo calcolatore? Tutti i lead registrati verranno cancellati.'
    );
    if (!confirmDelete) return;

    setDeleting(true);
    const { error } = await supabase
      .from('calculators')
      .delete()
      .eq('id', calculatorId)
      .eq('user_id', currentUser.id);

    setDeleting(false);

    if (error) {
      alert("Errore durante l'eliminazione.");
    } else {
      router.push('/dashboard');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleResetNew = () => {
    if (userPlan === 'free' && existingCalculatorsCount >= 1) {
      setShowUpgradeModal(true);
      return;
    }

    if (confirm('Vuoi creare un nuovo calcolatore da zero?')) {
      setCalculatorId(null);
      setTitle('Nuovo Calcolatore');
      setIsPublished(true);
      setPrivacyPolicyUrl('');
      setPrivacyText('Dichiaro di aver letto e accetto la');
      setPostSubmitAction('unlock');
      setRedirectUrl('');
      setWebhookUrl('');
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const addInput = () => {
    const newId = (inputs.length + 1).toString();
    setInputs([
      ...inputs,
      {
        id: newId,
        variable: `param_${newId}`,
        type: 'slider',
        label: `Nuovo Parametro ${newId}`,
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1
      }
    ]);
  };

  const updateInput = (index: number, key: keyof CalculatorInput, value: any) => {
    const updated = [...inputs];
    if (key === 'type' && value === 'select' && (!updated[index].options || updated[index].options?.length === 0)) {
      updated[index] = {
        ...updated[index],
        type: value,
        defaultValue: 10,
        options: [
          { label: 'Opzione Base', value: 10 },
          { label: 'Opzione Avanzata', value: 25 }
        ]
      };
    } else {
      updated[index] = { ...updated[index], [key]: value };
    }
    setInputs(updated);
  };

  const removeInput = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index));
  };

  const addSelectOption = (inputIndex: number) => {
    const updated = [...inputs];
    const currentOptions = updated[inputIndex].options || [];
    const newOption = {
      label: `Opzione ${currentOptions.length + 1}`,
      value: (currentOptions.length + 1) * 10
    };
    updated[inputIndex].options = [...currentOptions, newOption];
    setInputs(updated);
  };

  const updateSelectOption = (
    inputIndex: number,
    optionIndex: number,
    key: 'label' | 'value',
    val: any
  ) => {
    const updated = [...inputs];
    const opts = [...(updated[inputIndex].options || [])];
    opts[optionIndex] = { ...opts[optionIndex], [key]: key === 'value' ? parseFloat(val) || 0 : val };
    updated[inputIndex].options = opts;
    if (optionIndex === 0) {
      updated[inputIndex].defaultValue = opts[0].value;
    }
    setInputs(updated);
  };

  const removeSelectOption = (inputIndex: number, optionIndex: number) => {
    const updated = [...inputs];
    const opts = (updated[inputIndex].options || []).filter((_, i) => i !== optionIndex);
    updated[inputIndex].options = opts;
    if (opts.length > 0) {
      updated[inputIndex].defaultValue = opts[0].value;
    }
    setInputs(updated);
  };

  const updateOutput = (index: number, key: keyof CalculatorOutput, value: any) => {
    const updated = [...outputs];
    updated[index] = { ...updated[index], [key]: value };
    setOutputs(updated);
  };

  const getEmbedUrl = () => {
    if (typeof window === 'undefined' || !calculatorId) return '';
    return `${window.location.origin}/embed/${calculatorId}`;
  };

  const getIframeCode = () => {
    const url = getEmbedUrl();
    const cleanId = (calculatorId || 'preview').replace(/-/g, '_');
    return `<!-- Inizio Calcolatore CalcFlow -->
<iframe id="calcflow_${cleanId}" src="${url}" width="100%" height="550" frameborder="0" style="border:none; width:100%; max-width:100%; border-radius:16px; overflow:hidden;" scrolling="no"></iframe>
<script>
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'CALCFLOW_RESIZE' && e.data.calculatorId === '${calculatorId}') {
      var el = document.getElementById('calcflow_${cleanId}');
      if (el) { el.style.height = e.data.height + 'px'; }
    }
  });
</script>
<!-- Fine Calcolatore CalcFlow -->`;
  };

  const copyToClipboard = (text: string, type: 'link' | 'iframe') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  if (loadingExisting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Caricamento calcolatore...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen bg-slate-50 text-slate-900">
      <div className="lg:col-span-5 p-6 border-r border-slate-200 bg-white overflow-y-auto max-h-screen space-y-6">
        
        {/* Barra Utente & Avatar Premium */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <UserAvatar
            email={currentUser?.email}
            plan={userPlan}
            onLogout={handleLogout}
            onUpgradeClick={() => setShowUpgradeModal(true)}
          />
          <div className="flex items-center gap-2">
            {userPlan === 'free' && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="hidden sm:inline-flex text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200"
              >
                ★ Upgrade Pro
              </button>
            )}
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1"
            >
              Dashboard ↗
            </Link>
          </div>
        </div>

        {/* Intestazione */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {calculatorId ? `ID: ${calculatorId.slice(0, 8)}...` : 'Bozza non salvata'}
            </span>
            <button
              onClick={handleResetNew}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              + Crea Nuovo
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium">Nome Calcolatore</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold text-slate-900 p-1 border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none transition"
              placeholder="Es. Preventivatore Servizi B2B"
            />
          </div>
        </div>

        {/* Switch Pubblicato / Attivo */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
          <div>
            <span className="text-xs font-semibold text-slate-800 block">Stato Widget: {isPublished ? 'Attivo' : 'In Pausa'}</span>
            <span className="text-[11px] text-slate-500">Se disattivato, l'iFrame non sarà accessibile al pubblico</span>
          </div>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer accent-emerald-600"
          />
        </div>

        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
            <span>✓</span>
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSaveOrUpdate}
            disabled={saving || deleting}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Salvataggio...</span>
              </>
            ) : calculatorId ? (
              'Salva Modifiche (Aggiorna Live)'
            ) : (
              'Salva & Genera Codice Embed'
            )}
          </button>

          {calculatorId && (
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Codice Embed
            </button>
          )}
        </div>

        {calculatorId && (
          <div className="pt-2">
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="w-full py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              {deleting ? 'Eliminazione in corso...' : 'Elimina questo calcolatore'}
            </button>
          </div>
        )}

        {/* Aspetto */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Aspetto & Colori</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-slate-200"
            />
            <span className="text-sm font-mono text-slate-600">{primaryColor}</span>
          </div>
        </div>

        {/* Lead Gate, GDPR, Redirect & Webhook */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Richiedi Contatto (Lead Gate)</span>
              <span className="text-[11px] text-slate-500">Blocca i risultati finché l'utente non compila il modulo</span>
            </div>
            <input
              type="checkbox"
              checked={enableLeadGate}
              onChange={(e) => setEnableLeadGate(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-blue-600"
            />
          </div>

          {enableLeadGate && (
            <div className="pt-3 border-t border-slate-200 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Azione dopo l'Invio del Form
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPostSubmitAction('unlock')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition text-center cursor-pointer ${
                      postSubmitAction === 'unlock'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Sblocca Risultati
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostSubmitAction('redirect')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition text-center cursor-pointer ${
                      postSubmitAction === 'redirect'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Reindirizza a Link
                  </button>
                </div>

                {postSubmitAction === 'redirect' && (
                  <div className="pt-1">
                    <label className="text-xs text-slate-500">URL di Reindirizzamento (es. Calendly / Thank You Page)</label>
                    <input
                      type="url"
                      placeholder="https://calendly.com/tua-azienda/demo"
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Integrazione Webhook (Zapier / Make / n8n)
                </span>
                <label className="text-xs text-slate-500">URL Endpoint Webhook</label>
                <input
                  type="url"
                  placeholder="https://hook.eu1.make.com/tuo-token-webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Conformità Privacy (GDPR)
                </span>
                <div>
                  <label className="text-xs text-slate-500">URL Privacy Policy Aziendale</label>
                  <input
                    type="url"
                    placeholder="https://azienda.it/privacy"
                    value={privacyPolicyUrl}
                    onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Testo Consenso</label>
                  <input
                    type="text"
                    placeholder="Dichiaro di aver letto e accetto la"
                    value={privacyText}
                    onChange={(e) => setPrivacyText(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Campi Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Campi di Input</label>
            <button
              onClick={addInput}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition cursor-pointer"
            >
              + Aggiungi Campo
            </button>
          </div>

          {inputs.map((inp, idx) => (
            <div key={inp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-blue-600">Variabile: {inp.variable}</span>
                {inputs.length > 1 && (
                  <button onClick={() => removeInput(idx)} className="text-xs text-red-500 hover:text-red-700 cursor-pointer">
                    Rimuovi
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Tipo di Controllo</label>
                  <select
                    value={inp.type || 'slider'}
                    onChange={(e) => updateInput(idx, 'type', e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="slider">Slider Numerico</option>
                    <option value="number">Input Diretto (Numero)</option>
                    <option value="select">Menu a Tendina (Select)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Etichetta</label>
                  <input
                    type="text"
                    value={inp.label}
                    onChange={(e) => updateInput(idx, 'label', e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Prefisso/Simbolo</label>
                  <input
                    type="text"
                    placeholder="es. €"
                    value={inp.prefix || ''}
                    onChange={(e) => updateInput(idx, 'prefix', e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Suffisso</label>
                  <input
                    type="text"
                    placeholder="es. mq"
                    value={inp.suffix || ''}
                    onChange={(e) => updateInput(idx, 'suffix', e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>
              </div>

              {(inp.type === 'slider' || inp.type === 'number') && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-slate-500">Min</label>
                    <input
                      type="number"
                      value={inp.min}
                      onChange={(e) => updateInput(idx, 'min', parseFloat(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Max</label>
                    <input
                      type="number"
                      value={inp.max}
                      onChange={(e) => updateInput(idx, 'max', parseFloat(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Step</label>
                    <input
                      type="number"
                      value={inp.step}
                      onChange={(e) => updateInput(idx, 'step', parseFloat(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                  </div>
                </div>
              )}

              {inp.type === 'select' && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Opzioni Tendina</label>
                    <button
                      type="button"
                      onClick={() => addSelectOption(idx)}
                      className="text-[11px] text-blue-600 font-semibold hover:text-blue-800"
                    >
                      + Aggiungi Opzione
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {inp.options?.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Etichetta (es. Piano Pro)"
                          value={opt.label}
                          onChange={(e) => updateSelectOption(idx, optIdx, 'label', e.target.value)}
                          className="flex-1 text-xs p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                        />
                        <input
                          type="number"
                          placeholder="Valore"
                          value={opt.value}
                          onChange={(e) => updateSelectOption(idx, optIdx, 'value', e.target.value)}
                          className="w-20 text-xs p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                        />
                        {(inp.options?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSelectOption(idx, optIdx)}
                            className="text-xs text-red-500 hover:text-red-700 px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Risultati */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Risultati & Formule</label>
            <span className="text-[10px] text-slate-400 font-mono">Supporta ? : &gt; &lt; min() max()</span>
          </div>
          {outputs.map((out, idx) => (
            <div key={out.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div>
                <label className="text-xs text-slate-500">Titolo Risultato</label>
                <input
                  type="text"
                  value={out.label}
                  onChange={(e) => updateOutput(idx, 'label', e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">Formula Matematica / Logica</label>
                <input
                  type="text"
                  value={out.formula}
                  onChange={(e) => updateOutput(idx, 'formula', e.target.value)}
                  className="w-full font-mono text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-7 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-xl">
          <div className="mb-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Anteprima Live Widget</span>
          </div>
          <CalculatorPreview
            calculatorId={calculatorId || undefined}
            inputs={inputs}
            outputs={outputs}
            primaryColor={primaryColor}
            enableLeadGate={enableLeadGate}
            privacyPolicyUrl={privacyPolicyUrl}
            privacyText={privacyText}
            postSubmitAction={postSubmitAction}
            redirectUrl={redirectUrl}
            webhookUrl={webhookUrl}
          />
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Codice Calcolatore Pronto!</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Link Diretto</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  type="text"
                  value={getEmbedUrl()}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                />
                <button
                  onClick={() => copyToClipboard(getEmbedUrl(), 'link')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap"
                >
                  {copiedType === 'link' ? 'Copiato!' : 'Copia Link'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Codice Embed Responsive</label>
                <span className="text-[10px] text-emerald-600 font-medium">✓ Auto-resize mobile attivo</span>
              </div>
              <textarea
                readOnly
                rows={5}
                value={getIframeCode()}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 resize-none"
              />
              <button
                onClick={() => copyToClipboard(getIframeCode(), 'iframe')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                {copiedType === 'iframe' ? 'Codice Copiato!' : 'Copia Codice iFrame'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl font-black">
              ★
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Passa a CalcFlow Pro</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Il piano Gratuito include 1 calcolatore. Effettua l'upgrade a Pro per crearne senza limiti.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Calcolatori illimitati</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Lead e preventivi illimitati</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Webhooks istantanei (Zapier / Make / CRM)</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-2xl font-black text-slate-900">
                29€ <span className="text-xs font-normal text-slate-500">/ mese</span>
              </div>

              <button
                onClick={() => {
                  alert('Integrazione Stripe Checkout pronta per essere collegata!');
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                Attiva Abbonamento Pro
              </button>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Continua con il piano gratuito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}