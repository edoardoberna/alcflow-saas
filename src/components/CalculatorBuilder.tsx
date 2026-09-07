'use client';

import React, { useState, useMemo } from 'react';
import {
  evaluateFormula,
  CalculatorInput,
  CalculatorOutput
} from '@/lib/calculator-engine';
import CalculatorPreview from '@/components/CalculatorPreview';

export interface CalculatorData {
  id?: string;
  title: string;
  inputs: CalculatorInput[];
  outputs: CalculatorOutput[];
  primaryColor: string;
  enableLeadGate: boolean;
  privacyPolicyUrl: string;
  privacyText: string;
  postSubmitAction: 'unlock' | 'redirect';
  redirectUrl: string;
  webhookUrl: string;
  isPublished: boolean;
}

interface CalculatorBuilderProps {
  initialData?: CalculatorData;
  onSave: (data: CalculatorData) => Promise<void>;
  saving?: boolean;
}

const SWATCHES = [
  { label: 'Accento Blu', value: '#4D7CFE' },
  { label: 'Ciano Signal', value: '#4CC9FF' },
  { label: 'Menta Glow', value: '#2CE0A5' },
  { label: 'Viola Quantum', value: '#8B7CFF' },
  { label: 'Ambra Allarme', value: '#FFB224' }
];

export default function CalculatorBuilder({
  initialData,
  onSave,
  saving = false
}: CalculatorBuilderProps) {
  const [activeTab, setActiveTab] = useState<'inputs' | 'outputs' | 'gate' | 'style'>('inputs');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Stato Terminale
  const [title, setTitle] = useState(initialData?.title || 'Nuovo Terminale di Stima');
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);
  const [primaryColor, setPrimaryColor] = useState(initialData?.primaryColor || '#4D7CFE');
  const [enableLeadGate, setEnableLeadGate] = useState(initialData?.enableLeadGate ?? true);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState(initialData?.privacyPolicyUrl || '');
  const [privacyText, setPrivacyText] = useState(
    initialData?.privacyText || 'Dichiaro di aver letto e accetto la'
  );
  const [postSubmitAction, setPostSubmitAction] = useState<'unlock' | 'redirect'>(
    initialData?.postSubmitAction || 'unlock'
  );
  const [redirectUrl, setRedirectUrl] = useState(initialData?.redirectUrl || '');
  const [webhookUrl, setWebhookUrl] = useState(initialData?.webhookUrl || '');

  // Parametri di Input
  const [inputs, setInputs] = useState<CalculatorInput[]>(
    initialData?.inputs?.length
      ? initialData.inputs
      : [
          {
            id: 'inp_1',
            variable: 'pagine',
            type: 'slider',
            label: 'Numero pagine',
            defaultValue: 5,
            min: 1,
            max: 30,
            step: 1,
            prefix: '',
            suffix: 'unità'
          },
          {
            id: 'inp_2',
            variable: 'ore',
            type: 'number',
            label: 'Complessità Grafica (Ore)',
            defaultValue: 40,
            min: 10,
            max: 200,
            step: 5,
            prefix: 'h',
            suffix: ''
          }
        ]
  );

  // Risultati & Formule
  const [outputs, setOutputs] = useState<CalculatorOutput[]>(
    initialData?.outputs?.length
      ? initialData.outputs
      : [
          {
            id: 'out_1',
            variable: 'totale',
            label: 'Stima Totale Progetto',
            formula: '(pagine * 120) + (ore * 45)',
            prefix: '€',
            suffix: '',
            highlight: true
          }
        ]
  );

  // Validazione Formule Real-Time
  const formulaValidation = useMemo(() => {
    const mockValues: Record<string, number> = {};
    inputs.forEach((inp) => {
      if (inp.variable) {
        mockValues[inp.variable] = Number(inp.defaultValue ?? inp.min ?? 1);
      }
    });

    const status: Record<string, { isValid: boolean; sampleResult: number | string }> = {};
    outputs.forEach((out) => {
      if (!out.variable) return;
      try {
        const val = evaluateFormula(out.formula || '0', mockValues);
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          status[out.id || out.variable] = {
            isValid: true,
            sampleResult: val.toLocaleString('it-IT', { maximumFractionDigits: 2 })
          };
        } else {
          status[out.id || out.variable] = { isValid: false, sampleResult: 'Non valido' };
        }
      } catch (err: any) {
        status[out.id || out.variable] = { isValid: false, sampleResult: err.message || 'Errore' };
      }
    });
    return status;
  }, [inputs, outputs]);

  // Gestione Input con parser numerico permissivo (non blocca se il campo è vuoto)
  const handleAddInput = () => {
    const nextIdx = inputs.length + 1;
    const nextId = `inp_${Date.now().toString().slice(-4)}`;
    setInputs([
      ...inputs,
      {
        id: nextId,
        variable: `parametro_${nextIdx}`,
        type: 'slider',
        label: `Parametro ${nextIdx}`,
        defaultValue: 10,
        min: 0,
        max: 100,
        step: 1
      }
    ]);
  };

  const handleUpdateInput = (index: number, field: keyof CalculatorInput, rawValue: any) => {
    setInputs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: rawValue };
      return copy;
    });
  };

  const handleRemoveInput = (index: number) => {
    setInputs((prev) => prev.filter((_, i) => i !== index));
  };

  // Gestione Output
  const handleAddOutput = () => {
    const nextIdx = outputs.length + 1;
    const nextId = `out_${Date.now().toString().slice(-4)}`;
    setOutputs([
      ...outputs,
      {
        id: nextId,
        variable: `risultato_${nextIdx}`,
        label: `Risultato ${nextIdx}`,
        formula: inputs[0]?.variable || '0',
        prefix: '€',
        highlight: false
      }
    ]);
  };

  const handleUpdateOutput = (index: number, field: keyof CalculatorOutput, value: any) => {
    setOutputs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveOutput = (index: number) => {
    setOutputs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: initialData?.id,
      title,
      inputs: inputs.map((inp) => ({
        ...inp,
        defaultValue: Number(inp.defaultValue) || 0,
        min: Number(inp.min) || 0,
        max: Number(inp.max) || 100,
        step: Number(inp.step) || 1
      })),
      outputs,
      primaryColor,
      enableLeadGate,
      privacyPolicyUrl,
      privacyText,
      postSubmitAction,
      redirectUrl,
      webhookUrl,
      isPublished
    });
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://calcflow.io';
  const targetCalcId = initialData?.id || 'ID_CALCOLATORE';

  const embedCode = `<!-- CalcFlow Terminal Embed -->
<iframe
  id="cf-frame-${targetCalcId}"
  src="${currentOrigin}/embed/${targetCalcId}"
  style="width:100%;min-height:640px;border:0;border-radius:14px;overflow:hidden;transition:height 0.2s ease;"
  loading="lazy"
  title="${title}">
</iframe>
<script>
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'CALCFLOW_RESIZE' && e.data.calculatorId === '${targetCalcId}') {
      var f = document.getElementById('cf-frame-${targetCalcId}');
      if (f && e.data.height) {
        f.style.height = (e.data.height + 16) + 'px';
      }
    }
  });
</script>`;

  const copyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="w-full">
      {/* Intestazione Barra Superiore */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl sm:text-2xl font-bold text-white bg-transparent border-b border-white/20 hover:border-white focus:border-accent focus:outline-none transition py-1"
            placeholder="Nome del Calcolatore..."
          />
          <span className={`badge ${isPublished ? 'badge-mint' : 'badge-amber'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-mint' : 'bg-amber'}`} />
            {isPublished ? 'ONLINE' : 'IN PAUSA'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {initialData?.id && (
            <button
              type="button"
              onClick={() => setShowEmbedModal(true)}
              className="btn btn-ghost btn-sm text-slate-200 hover:text-white"
            >
              Codice Embed &lt;/&gt;
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary btn-sm !px-6 !py-2.5 font-bold shadow-[0_0_20px_rgba(77,124,254,0.4)] cursor-pointer"
          >
            {saving ? 'Salvataggio…' : 'SALVA MODIFICHE'}
          </button>
        </div>
      </div>

      {/* Tabs Mobile */}
      <div className="flex lg:hidden grid-cols-2 gap-1 p-1 mb-6 rounded-lg bg-raised border border-white/10">
        <button
          type="button"
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider rounded ${
            mobileView === 'editor' ? 'bg-white/10 text-white font-bold' : 'text-slate-400'
          }`}
        >
          Editor Configurazione
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider rounded ${
            mobileView === 'preview' ? 'bg-white/10 text-white font-bold' : 'text-slate-400'
          }`}
        >
          Anteprima Live
        </button>
      </div>

      {/* Split Screen Principale */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Colonna SX: Configurazione Editor */}
        <div className={`lg:col-span-6 space-y-6 ${mobileView === 'preview' ? 'hidden lg:block' : ''}`}>
          {/* Barra Navigazione Tabs */}
          <div className="flex border-b border-white/10 gap-3 pb-px font-mono text-xs uppercase tracking-wider">
            {[
              { id: 'inputs', label: `1. Input (${inputs.length})` },
              { id: 'outputs', label: `2. Risultati (${outputs.length})` },
              { id: 'gate', label: '3. Lead Gate' },
              { id: 'style', label: '4. Stile & Stato' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 transition-colors border-b-2 font-semibold cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-accent text-white font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: INPUT */}
          {activeTab === 'inputs' && (
            <div className="space-y-4">
              {inputs.map((inp, idx) => (
                <div key={inp.id || idx} className="panel p-5 space-y-4 border border-white/10 bg-[#0C1019]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-accent-hi uppercase tracking-wider">
                      PARAMETRO #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInput(idx)}
                      disabled={inputs.length <= 1}
                      className="text-xs font-mono text-rose hover:underline disabled:opacity-30 cursor-pointer"
                    >
                      Rimuovi
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Etichetta Visibile
                      </label>
                      <input
                        type="text"
                        value={inp.label}
                        onChange={(e) => handleUpdateInput(idx, 'label', e.target.value)}
                        className="field text-sm font-medium"
                        placeholder="Es: Numero pagine"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Identificatore Variabile
                      </label>
                      <input
                        type="text"
                        value={inp.variable}
                        onChange={(e) =>
                          handleUpdateInput(
                            idx,
                            'variable',
                            e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                          )
                        }
                        className="field field-mono text-sm font-semibold text-accent-hi"
                        placeholder="Es: pagine"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Tipologia
                      </label>
                      <select
                        value={inp.type}
                        onChange={(e) => handleUpdateInput(idx, 'type', e.target.value)}
                        className="field text-xs font-medium"
                      >
                        <option value="slider">Slider</option>
                        <option value="number">Campo Numerico</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Valore Iniziale
                      </label>
                      <input
                        type="number"
                        value={inp.defaultValue ?? ''}
                        onChange={(e) => handleUpdateInput(idx, 'defaultValue', e.target.value === '' ? '' : Number(e.target.value))}
                        className="field field-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Passo (Step)
                      </label>
                      <input
                        type="number"
                        value={inp.step ?? ''}
                        onChange={(e) => handleUpdateInput(idx, 'step', e.target.value === '' ? '' : Number(e.target.value))}
                        className="field field-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Minimo
                      </label>
                      <input
                        type="number"
                        value={inp.min ?? ''}
                        onChange={(e) => handleUpdateInput(idx, 'min', e.target.value === '' ? '' : Number(e.target.value))}
                        className="field field-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Massimo
                      </label>
                      <input
                        type="number"
                        value={inp.max ?? ''}
                        onChange={(e) => handleUpdateInput(idx, 'max', e.target.value === '' ? '' : Number(e.target.value))}
                        className="field field-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Prefisso
                      </label>
                      <input
                        type="text"
                        value={inp.prefix || ''}
                        onChange={(e) => handleUpdateInput(idx, 'prefix', e.target.value)}
                        placeholder="Es: €"
                        className="field text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Suffisso
                      </label>
                      <input
                        type="text"
                        value={inp.suffix || ''}
                        onChange={(e) => handleUpdateInput(idx, 'suffix', e.target.value)}
                        placeholder="Es: unità"
                        className="field text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddInput}
                className="btn btn-ghost w-full !py-3 font-mono text-xs border-dashed text-slate-300 hover:text-white cursor-pointer"
              >
                + Aggiungi Parametro Input
              </button>
            </div>
          )}

          {/* TAB 2: RISULTATI (FORMULE) */}
          {activeTab === 'outputs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0C1019] border border-white/10 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-white">Variabili disponibili:</span>{' '}
                <code className="text-cyan font-mono font-semibold">
                  {inputs.map((i) => i.variable).filter(Boolean).join(', ') || 'nessuna'}
                </code>
              </div>

              {outputs.map((out, idx) => {
                const validation = formulaValidation[out.id || out.variable];
                return (
                  <div key={out.id || idx} className="panel p-5 space-y-4 border border-white/10 bg-[#0C1019]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-bold text-mint uppercase tracking-wider">
                        VOCE RISULTATO #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOutput(idx)}
                        disabled={outputs.length <= 1}
                        className="text-xs font-mono text-rose hover:underline disabled:opacity-30 cursor-pointer"
                      >
                        Rimuovi
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                          Nome Risultato
                        </label>
                        <input
                          type="text"
                          value={out.label}
                          onChange={(e) => handleUpdateOutput(idx, 'label', e.target.value)}
                          className="field text-sm font-medium"
                          placeholder="Es: Totale Stimato"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                          Identificatore Variabile
                        </label>
                        <input
                          type="text"
                          value={out.variable}
                          onChange={(e) =>
                            handleUpdateOutput(
                              idx,
                              'variable',
                              e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                            )
                          }
                          className="field field-mono text-sm font-semibold text-accent-hi"
                          placeholder="Es: totale"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                          Formula Matematica
                        </label>
                        {validation && (
                          <span className={`font-mono text-[11px] font-bold ${validation.isValid ? 'text-mint' : 'text-rose'}`}>
                            {validation.isValid ? `✓ Valida (Test: ${validation.sampleResult})` : `✕ ${validation.sampleResult}`}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={out.formula}
                        onChange={(e) => handleUpdateOutput(idx, 'formula', e.target.value)}
                        className={`field field-mono text-xs font-semibold ${
                          validation && !validation.isValid ? 'border-rose focus:border-rose' : ''
                        }`}
                        placeholder="Es: (pagine * 120) + (ore * 45)"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 items-center">
                      <div>
                        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                          Prefisso
                        </label>
                        <input
                          type="text"
                          value={out.prefix || ''}
                          onChange={(e) => handleUpdateOutput(idx, 'prefix', e.target.value)}
                          placeholder="€"
                          className="field text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                          Suffisso
                        </label>
                        <input
                          type="text"
                          value={out.suffix || ''}
                          onChange={(e) => handleUpdateOutput(idx, 'suffix', e.target.value)}
                          placeholder="/ anno"
                          className="field text-xs"
                        />
                      </div>
                      <div className="pt-5">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-200 select-none">
                          <input
                            type="checkbox"
                            checked={out.highlight || false}
                            onChange={(e) => handleUpdateOutput(idx, 'highlight', e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-raised accent-accent cursor-pointer"
                          />
                          Evidenzia Principale
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddOutput}
                className="btn btn-ghost w-full !py-3 font-mono text-xs border-dashed text-slate-300 hover:text-white cursor-pointer"
              >
                + Aggiungi Voce Risultato
              </button>
            </div>
          )}

          {/* TAB 3: LEAD GATE */}
          {activeTab === 'gate' && (
            <div className="panel p-6 space-y-5 border border-white/10 bg-[#0C1019]">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h4 className="text-sm font-bold text-white">Abilita Blocco Risultati (Lead Gate)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    I risultati vengono nascosti finché l'utente non compila il modulo contatti.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableLeadGate}
                  onChange={(e) => setEnableLeadGate(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-raised accent-accent cursor-pointer"
                />
              </div>

              {enableLeadGate && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      URL Privacy Policy (Opzionale)
                    </label>
                    <input
                      type="url"
                      value={privacyPolicyUrl}
                      onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                      placeholder="https://tuosito.it/privacy"
                      className="field text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Testo Consenso Privacy Obbligatorio
                    </label>
                    <input
                      type="text"
                      value={privacyText}
                      onChange={(e) => setPrivacyText(e.target.value)}
                      className="field text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Azione dopo l'invio
                    </label>
                    <select
                      value={postSubmitAction}
                      onChange={(e) => setPostSubmitAction(e.target.value as any)}
                      className="field text-xs font-medium"
                    >
                      <option value="unlock">Sblocca e mostra i risultati a schermo</option>
                      <option value="redirect">Reindirizza a una pagina esterna</option>
                    </select>
                  </div>

                  {postSubmitAction === 'redirect' && (
                    <div>
                      <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        URL di Reindirizzamento
                      </label>
                      <input
                        type="url"
                        value={redirectUrl}
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        placeholder="https://tuosito.it/grazie"
                        className="field text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Webhook di Invio Istantaneo (Make / Zapier / n8n)
                    </label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hook.eu1.make.com/..."
                      className="field field-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STILE & STATO */}
          {activeTab === 'style' && (
            <div className="panel p-6 space-y-6 border border-white/10 bg-[#0C1019]">
              <div>
                <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Colore Primario del Terminale
                </label>
                <div className="flex items-center gap-3">
                  {SWATCHES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setPrimaryColor(s.value)}
                      title={s.label}
                      className={`w-9 h-9 rounded-lg border transition cursor-pointer ${
                        primaryColor === s.value ? 'scale-110 border-white shadow-md' : 'border-white/10'
                      }`}
                      style={{ backgroundColor: s.value }}
                    />
                  ))}
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="field field-mono text-xs !w-28 uppercase font-semibold"
                  />
                </div>
              </div>

              <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Stato Pubblicazione</h4>
                  <p className="text-xs text-slate-400">Se disattivato, l'embed mostrerà un avviso di manutenzione.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`btn btn-sm ${isPublished ? 'btn-soft' : 'btn-ghost'} font-mono uppercase tracking-wider cursor-pointer`}
                >
                  {isPublished ? 'ONLINE' : 'IN PAUSA'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Colonna DX: Anteprima Live sticky */}
        <div className={`lg:col-span-6 sticky top-24 ${mobileView === 'editor' ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-slate-300 font-bold">
              Anteprima Tempo Reale
            </span>
            <span className="badge badge-accent">LIVE PREVIEW</span>
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-surface/50 backdrop-blur-md shadow-2xl">
            <CalculatorPreview
              calculatorId={initialData?.id || 'preview'}
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
      </div>

      {/* Modal Snippet Embed */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md">
          <div className="panel p-6 max-w-xl w-full space-y-4 shadow-2xl border-white/10 bg-[#0C1019]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                Incorporamento Calcolatore
              </h3>
              <button
                type="button"
                onClick={() => setShowEmbedModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Copia questo codice HTML completo di auto-ridimensionamento dinamico:
            </p>

            <pre className="code-block p-4 text-[11px] text-accent-hi overflow-x-auto selection:bg-accent/40 font-mono">
              {embedCode}
            </pre>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEmbedModal(false)}
                className="btn btn-ghost btn-sm cursor-pointer"
              >
                Chiudi
              </button>
              <button
                type="button"
                onClick={copyEmbed}
                className="btn btn-primary btn-sm cursor-pointer"
              >
                {copiedSnippet ? '✓ Copiato!' : 'Copia Snippet Completo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}