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

  // Stato completo del Calcolatore
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
            variable: 'volume',
            type: 'slider',
            label: 'Volume Mensile Stimato',
            defaultValue: 1000,
            min: 100,
            max: 10000,
            step: 50,
            prefix: '',
            suffix: 'unità'
          },
          {
            id: 'inp_2',
            variable: 'prezzo_unitario',
            type: 'number',
            label: 'Costo Medio per Unità',
            defaultValue: 45,
            min: 1,
            max: 1000,
            step: 1,
            prefix: '€',
            suffix: ''
          }
        ]
  );

  // Risultati e Formule
  const [outputs, setOutputs] = useState<CalculatorOutput[]>(
    initialData?.outputs?.length
      ? initialData.outputs
      : [
          {
            id: 'out_1',
            variable: 'totale_annuo',
            label: 'Ricavo Annuale Stimato',
            formula: 'volume * prezzo_unitario * 12',
            prefix: '€',
            suffix: '/ anno',
            highlight: true
          },
          {
            id: 'out_2',
            variable: 'totale_mensile',
            label: 'Ricavo Mensile',
            formula: 'volume * prezzo_unitario',
            prefix: '€',
            suffix: '/ mese',
            highlight: false
          }
        ]
  );

  // Validazione formule in tempo reale
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
          status[out.id || out.variable] = { isValid: false, sampleResult: 'Risultato non numerico' };
        }
      } catch (err: any) {
        status[out.id || out.variable] = { isValid: false, sampleResult: err.message || 'Errore sintassi' };
      }
    });
    return status;
  }, [inputs, outputs]);

  // Gestione Input
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
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1
      }
    ]);
  };

  const handleUpdateInput = (index: number, field: keyof CalculatorInput, value: any) => {
    setInputs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
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
      inputs,
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

  const embedCode = `<iframe
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://calcflow.io'}/embed/${initialData?.id || 'IL_TUO_ID'}"
  style="width:100%;height:680px;border:0;border-radius:14px;overflow:hidden;"
  loading="lazy"
  title="${title}">
</iframe>`;

  const copyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="w-full">
      {/* Testata di salvataggio */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-line mb-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl sm:text-2xl font-bold text-ink bg-transparent border-b border-transparent hover:border-line focus:border-accent focus:outline-none transition py-1"
            placeholder="Nome del Calcolatore..."
          />
          <span className={`badge ${isPublished ? 'badge-mint' : 'badge-amber'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-mint' : 'bg-amber'}`} />
            {isPublished ? 'Online' : 'In Pausa'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {initialData?.id && (
            <button
              type="button"
              onClick={() => setShowEmbedModal(true)}
              className="btn btn-ghost btn-sm"
            >
              Codice Embed &lt;/&gt;
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary btn-sm"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scrittura…
              </span>
            ) : (
              'Salva Modifiche'
            )}
          </button>
        </div>
      </div>

      {/* Switcher Mobile: Editor vs Live Preview */}
      <div className="flex lg:hidden grid-cols-2 gap-1 p-1 mb-6 rounded-lg bg-raised border border-line">
        <button
          type="button"
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider rounded ${
            mobileView === 'editor' ? 'bg-overlay text-ink font-bold' : 'text-faint'
          }`}
        >
          Editor Configurazione
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider rounded ${
            mobileView === 'preview' ? 'bg-overlay text-ink font-bold' : 'text-faint'
          }`}
        >
          Anteprima Live
        </button>
      </div>

      {/* Layout Split Screen */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Colonna SX: Configurazione */}
        <div className={`lg:col-span-6 space-y-6 ${mobileView === 'preview' ? 'hidden lg:block' : ''}`}>
          {/* Navigatore Tabs interno */}
          <div className="flex border-b border-line gap-2 overflow-x-auto pb-px font-mono text-xs uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setActiveTab('inputs')}
              className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'inputs'
                  ? 'border-accent text-accent-hi font-bold'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              1. Input ({inputs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('outputs')}
              className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'outputs'
                  ? 'border-accent text-accent-hi font-bold'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              2. Risultati ({outputs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gate')}
              className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'gate'
                  ? 'border-accent text-accent-hi font-bold'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              3. Lead Gate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('style')}
              className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'style'
                  ? 'border-accent text-accent-hi font-bold'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              4. Stile & Stato
            </button>
          </div>

          {/* TAB 1: INPUTS */}
          {activeTab === 'inputs' && (
            <div className="space-y-4">
              {inputs.map((inp, idx) => (
                <div key={inp.id || idx} className="panel p-4 space-y-3 relative">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] text-faint">PARAMETRO #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInput(idx)}
                      disabled={inputs.length <= 1}
                      className="text-xs text-rose hover:underline disabled:opacity-30 disabled:no-underline cursor-pointer"
                    >
                      Rimuovi
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
                        Etichetta Visibile
                      </label>
                      <input
                        type="text"
                        value={inp.label}
                        onChange={(e) => handleUpdateInput(idx, 'label', e.target.value)}
                        className="field text-xs"
                        placeholder="Es: Volume Mensile"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
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
                        className="field field-mono text-xs text-accent-hi"
                        placeholder="Es: volume"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
                        Tipologia
                      </label>
                      <select
                        value={inp.type}
                        onChange={(e) => handleUpdateInput(idx, 'type', e.target.value)}
                        className="field text-xs"
                      >
                        <option value="slider">Slider</option>
                        <option value="number">Campo Numerico</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
                        Valore Iniziale
                      </label>
                      <input
                        type="number"
                        value={inp.defaultValue}
                        onChange={(e) => handleUpdateInput(idx, 'defaultValue', parseFloat(e.target.value) || 0)}
                        className="field field-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
                        Passo (Step)
                      </label>
                      <input
                        type="number"
                        value={inp.step ?? 1}
                        onChange={(e) => handleUpdateInput(idx, 'step', parseFloat(e.target.value) || 1)}
                        className="field field-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">Minimo</label>
                      <input
                        type="number"
                        value={inp.min ?? 0}
                        onChange={(e) => handleUpdateInput(idx, 'min', parseFloat(e.target.value) || 0)}
                        className="field field-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">Massimo</label>
                      <input
                        type="number"
                        value={inp.max ?? 100}
                        onChange={(e) => handleUpdateInput(idx, 'max', parseFloat(e.target.value) || 100)}
                        className="field field-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">Prefisso</label>
                      <input
                        type="text"
                        value={inp.prefix || ''}
                        onChange={(e) => handleUpdateInput(idx, 'prefix', e.target.value)}
                        placeholder="Es: €"
                        className="field text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">Suffisso</label>
                      <input
                        type="text"
                        value={inp.suffix || ''}
                        onChange={(e) => handleUpdateInput(idx, 'suffix', e.target.value)}
                        placeholder="Es: / mese"
                        className="field text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddInput}
                className="btn btn-ghost w-full !py-3 text-xs border-dashed"
              >
                + Aggiungi Parametro Input
              </button>
            </div>
          )}

          {/* TAB 2: OUTPUTS & FORMULE */}
          {activeTab === 'outputs' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-surface border border-line text-xs text-muted leading-relaxed">
                <span className="font-bold text-ink">Guida formule:</span> Usa i nomi delle variabili definiti
                negli input (es. <code className="text-cyan">{inputs.map((i) => i.variable).join(', ')}</code>).
                Supporta operatori aritmetici <code className="text-accent-hi">+ - * /</code>, parentesi e
                operatore ternario <code className="text-mint">condizione ? se_vero : se_falso</code>.
              </div>

              {outputs.map((out, idx) => {
                const validation = formulaValidation[out.id || out.variable];
                return (
                  <div key={out.id || idx} className="panel p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] text-faint">VOCE RISULTATO #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOutput(idx)}
                        disabled={outputs.length <= 1}
                        className="text-xs text-rose hover:underline disabled:opacity-30 disabled:no-underline cursor-pointer"
                      >
                        Rimuovi
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
                          Nome Risultato
                        </label>
                        <input
                          type="text"
                          value={out.label}
                          onChange={(e) => handleUpdateOutput(idx, 'label', e.target.value)}
                          className="field text-xs"
                          placeholder="Es: Risparmio Totale"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
                          Variabile Risultato
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
                          className="field field-mono text-xs text-accent-hi"
                          placeholder="Es: risparmio_totale"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-faint">
                          Formula Matematica
                        </label>
                        {validation && (
                          <span
                            className={`font-mono text-[9px] ${
                              validation.isValid ? 'text-mint' : 'text-rose'
                            }`}
                          >
                            {validation.isValid
                              ? `✓ Valida (Test: ${validation.sampleResult})`
                              : `✕ ${validation.sampleResult}`}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={out.formula}
                        onChange={(e) => handleUpdateOutput(idx, 'formula', e.target.value)}
                        className={`field field-mono text-xs ${
                          validation && !validation.isValid ? 'border-rose focus:border-rose' : ''
                        }`}
                        placeholder="Es: volume * 1.2"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 items-center">
                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">Prefisso</label>
                        <input
                          type="text"
                          value={out.prefix || ''}
                          onChange={(e) => handleUpdateOutput(idx, 'prefix', e.target.value)}
                          placeholder="€"
                          className="field text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">Suffisso</label>
                        <input
                          type="text"
                          value={out.suffix || ''}
                          onChange={(e) => handleUpdateOutput(idx, 'suffix', e.target.value)}
                          placeholder="/ anno"
                          className="field text-xs"
                        />
                      </div>
                      <div className="pt-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-muted select-none">
                          <input
                            type="checkbox"
                            checked={out.highlight || false}
                            onChange={(e) => handleUpdateOutput(idx, 'highlight', e.target.checked)}
                            className="checkbox"
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
                className="btn btn-ghost w-full !py-3 text-xs border-dashed"
              >
                + Aggiungi Voce Risultato
              </button>
            </div>
          )}

          {/* TAB 3: LEAD GATE */}
          {activeTab === 'gate' && (
            <div className="panel p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <h4 className="text-sm font-semibold text-ink">Abilita Blocco Risultati (Lead Gate)</h4>
                  <p className="text-xs text-muted">
                    I risultati vengono nascosti finché il visitatore non lascia email e nome.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableLeadGate}
                  onChange={(e) => setEnableLeadGate(e.target.checked)}
                  className="checkbox"
                />
              </div>

              {enableLeadGate && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
                      URL Privacy Policy
                    </label>
                    <input
                      type="url"
                      value={privacyPolicyUrl}
                      onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                      placeholder="https://tuosito.it/privacy"
                      className="field text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
                      Testo Consenso Privacy
                    </label>
                    <input
                      type="text"
                      value={privacyText}
                      onChange={(e) => setPrivacyText(e.target.value)}
                      className="field text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
                      Azione dopo l’invio del contatto
                    </label>
                    <select
                      value={postSubmitAction}
                      onChange={(e) => setPostSubmitAction(e.target.value as any)}
                      className="field text-xs"
                    >
                      <option value="unlock">Sblocca e mostra i risultati a schermo</option>
                      <option value="redirect">Reindirizza a una pagina esterna</option>
                    </select>
                  </div>

                  {postSubmitAction === 'redirect' && (
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
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
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-faint mb-1">
                      Webhook di Invio Istantaneo (Make, Zapier, n8n, CRM)
                    </label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hook.eu1.make.com/..."
                      className="field field-mono text-xs"
                    />
                    <span className="block font-mono text-[9px] text-faint mt-1">
                      Invia l’intero stato degli input e dei calcoli appena il lead viene registrato.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STILE & STATO */}
          {activeTab === 'style' && (
            <div className="panel p-5 space-y-6">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-faint mb-3">
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
                        primaryColor === s.value ? 'scale-110 border-white shadow-md' : 'border-line'
                      }`}
                      style={{ backgroundColor: s.value }}
                    />
                  ))}
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="field field-mono text-xs !w-28 uppercase"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-ink">Stato Pubblicazione</h4>
                  <p className="text-xs text-muted">Se disattivato, l’embed mostrerà un avviso di manutenzione.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`btn btn-sm ${isPublished ? 'btn-soft' : 'btn-ghost'}`}
                >
                  {isPublished ? 'Online' : 'In Pausa'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Colonna DX: Anteprima Live sticky */}
        <div className={`lg:col-span-6 sticky top-24 ${mobileView === 'editor' ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              Anteprima Tempo Reale
            </span>
            <span className="badge badge-accent">Live Preview</span>
          </div>

          <div className="p-4 rounded-xl border border-line-strong/40 bg-surface/50 backdrop-blur-sm shadow-2xl">
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
          <div className="panel p-6 max-w-lg w-full space-y-4 shadow-2xl border-line-strong">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                Incorporamento Calcolatore
              </h3>
              <button
                type="button"
                onClick={() => setShowEmbedModal(false)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Copia questo codice HTML e incollalo in qualsiasi CMS (WordPress, Webflow, Shopify, Framer) o
              codice sorgente:
            </p>

            <pre className="code-block p-4 text-[11px] text-accent-hi overflow-x-auto selection:bg-accent/40">
              {embedCode}
            </pre>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEmbedModal(false)}
                className="btn btn-ghost btn-sm"
              >
                Chiudi
              </button>
              <button
                type="button"
                onClick={copyEmbed}
                className="btn btn-primary btn-sm"
              >
                {copiedSnippet ? '✓ Copiato!' : 'Copia Snippet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}