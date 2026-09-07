'use client';

import React, { useEffect, useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ==========================================
// TIPI E INTERFACCE DI TELEMETRIA
// ==========================================
interface CalculatorRecord {
  id: string;
  title: string;
  is_published: boolean;
  created_at: string;
  views_count: number;
  interactions_count: number;
}

interface LeadRecord {
  id: string;
  calculator_id: string;
  contact_data: {
    fullName?: string;
    email: string;
    phone?: string;
    company?: string;
    notes?: string;
  };
  calculation_state: {
    inputs: Record<string, number>;
    results: Record<string, number>;
  };
  page_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  device_type: string;
  created_at: string;
}

// ==========================================
// GENERATORE DI SPARKLINES SVG
// ==========================================
function generateSparklinePath(points: number[], width = 220, height = 44): string {
  if (!points || points.length === 0) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min === 0 ? 1 : max - min;
  const stepX = width / (points.length - 1);

  return points
    .map((val, idx) => {
      const x = idx * stepX;
      const y = height - ((val - min) / range) * (height - 12) - 6;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function DashboardPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Stati Principali Dati
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [calculators, setCalculators] = useState<CalculatorRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  
  // Stati UI & Navigazione
  const [selectedCalcFilter, setSelectedCalcFilter] = useState<string>('all');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [searchLeadQuery, setSearchLeadQuery] = useState('');
  
  // Modale Dettaglio Lead
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  // Modale Eliminazione Terminale
  const [calcToDelete, setCalcToDelete] = useState<CalculatorRecord | null>(null);

  // ==========================================
  // CARICAMENTO REGISTRO OPERATIVO
  // ==========================================
  const loadDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || '');

      // 1. Caricamento calcolatori dell'utente
      const { data: calcsData, error: calcsError } = await supabase
        .from('calculators')
        .select('id, title, is_published, created_at, views_count, interactions_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (calcsError) throw calcsError;
      setCalculators(calcsData || []);

      // 2. Caricamento lead associati
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);
    } catch (err) {
      console.error('Errore durante il recupero dei dati:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [router]);

  // ==========================================
  // METRICHE & TELEMETRIA FINANZIARIA
  // ==========================================
  const metrics = useMemo(() => {
    const totalCalcs = calculators.length;
    const onlineCalcs = calculators.filter((c) => c.is_published).length;
    const totalLeads = leads.length;

    // Media lead per terminale
    const leadsPerCalc = totalCalcs > 0 ? (totalLeads / totalCalcs).toFixed(1) : '0';

    // Pipeline economica complessiva generata (somma dei risultati primari)
    const pipelineTotal = leads.reduce((acc, lead) => {
      const results = lead.calculation_state?.results || {};
      const primaryVal = Object.values(results)[0] || 0;
      return acc + (typeof primaryVal === 'number' ? primaryVal : 0);
    }, 0);

    // Formattazione data ultimo lead
    let lastLeadTimeText = 'Nessuno';
    let lastLeadSub = 'In attesa del 1° lead';
    if (leads.length > 0) {
      const lastDate = new Date(leads[0].created_at);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffMinutes < 5) {
        lastLeadTimeText = 'adesso';
        lastLeadSub = `${lastDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} · real-time`;
      } else if (diffHours < 24) {
        lastLeadTimeText = 'oggi';
        lastLeadSub = lastDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      } else if (diffHours < 48) {
        lastLeadTimeText = 'ieri';
        lastLeadSub = lastDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      } else {
        lastLeadTimeText = lastDate.toLocaleDateString('it-IT');
        lastLeadSub = lastDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      }
    }

    return {
      totalCalcs,
      onlineCalcs,
      totalLeads,
      leadsPerCalc,
      pipelineTotal,
      lastLeadTimeText,
      lastLeadSub
    };
  }, [calculators, leads]);

  // ==========================================
  // AZIONI OPERATIVE TERMINALI
  // ==========================================
  const handleToggleStatus = async (calcId: string, currentStatus: boolean) => {
    startTransition(async () => {
      await supabase
        .from('calculators')
        .update({ is_published: !currentStatus })
        .eq('id', calcId);
      loadDashboardData(true);
    });
  };

  const confirmDeleteCalculator = async () => {
    if (!calcToDelete) return;
    startTransition(async () => {
      await supabase.from('calculators').delete().eq('id', calcToDelete.id);
      setCalcToDelete(null);
      loadDashboardData(true);
    });
  };

  // ==========================================
  // EXPORT CSV NORMALIZZATO (BI-READY)
  // ==========================================
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('Nessun record disponibile per l\'esportazione.');
      return;
    }

    const headers = [
      'Data / Ora',
      'ID Terminale',
      'Nome Terminale',
      'Nome Contatto',
      'Email',
      'Dispositivo',
      'Canale Marketing (UTM Source)',
      'Campagna (UTM Campaign)',
      'URL di Origine',
      'Parametri Input',
      'Totali Calcolati'
    ];

    const rows = leads.map((lead) => {
      const calcName = calcTitleMap[lead.calculator_id] || 'Terminale Sconosciuto';
      const inputsFormatted = Object.entries(lead.calculation_state?.inputs || {})
        .map(([k, v]) => `${k}:${v}`)
        .join(' | ');
      const resultsFormatted = Object.entries(lead.calculation_state?.results || {})
        .map(([k, v]) => `${k}:${v}`)
        .join(' | ');

      return [
        new Date(lead.created_at).toLocaleString('it-IT'),
        lead.calculator_id,
        `"${calcName}"`,
        `"${lead.contact_data?.fullName || ''}"`,
        `"${lead.contact_data?.email || ''}"`,
        lead.device_type || 'desktop',
        `"${lead.utm_source || 'Diretto'}"`,
        `"${lead.utm_campaign || '-'}"`,
        `"${lead.page_url || ''}"`,
        `"${inputsFormatted}"`,
        `"${resultsFormatted}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `calcflow_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Logout sicuro
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    document.cookie = 'calcflow_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  // Mappa di lookup titoli
  const calcTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    calculators.forEach((c) => {
      map[c.id] = c.title;
    });
    return map;
  }, [calculators]);

  // Lead filtrati e ricercabili
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchCalc = selectedCalcFilter === 'all' || l.calculator_id === selectedCalcFilter;
      const query = searchLeadQuery.toLowerCase().trim();
      if (!query) return matchCalc;

      const name = (l.contact_data?.fullName || '').toLowerCase();
      const email = (l.contact_data?.email || '').toLowerCase();
      const calcName = (calcTitleMap[l.calculator_id] || '').toLowerCase();
      const matchSearch = name.includes(query) || email.includes(query) || calcName.includes(query);

      return matchCalc && matchSearch;
    });
  }, [leads, selectedCalcFilter, searchLeadQuery, calcTitleMap]);

  // Sparkline Punti Dinamici
  const sparklineCalcs = [1, 1, 1, 2, 2, 2, 2, Math.max(1, calculators.length)];
  const sparklineLeads = [0, 0, 1, 1, 1, 2, 2, Math.max(1, leads.length)];
  const sparklineAvg = [0, 0, 0.5, 0.5, 0.5, 1, 1, parseFloat(metrics.leadsPerCalc) || 1];
  const sparklineTime = [10, 20, 15, 30, 25, 40, 35, 45];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-white">
        <span className="w-9 h-9 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
          Inizializzazione Console di Telemetria…
        </p>
      </div>
    );
  }

  const currentDateFormatted = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  return (
    <div className="min-h-screen bg-[#080C14] text-white p-4 sm:p-8 font-sans selection:bg-accent/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ========================================== */}
        {/* 1. HEADER DI NAVIGAZIONE E SESSIONE       */}
        {/* ========================================== */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center font-bold text-accent-hi text-base shadow-[0_0_15px_rgba(77,124,254,0.3)]">
              Σ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-extrabold tracking-widest text-white">CALCFLOW</span>
                <span className="chip text-[10px] uppercase tracking-wider text-slate-400 font-mono">CONSOLE // REGISTRO</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="btn btn-ghost btn-sm text-xs text-slate-300 hover:text-white"
            >
              ← Vetrina
            </Link>

            <Link
              href="/dashboard/settings"
              className="btn btn-ghost btn-sm text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <span>⚙</span> Impostazioni & Hub
            </Link>

            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              title="Aggiorna Dati"
              disabled={refreshing}
              className="btn btn-ghost btn-sm text-slate-300 hover:text-white p-2"
            >
              <span className={`inline-block ${refreshing ? 'animate-spin' : ''}`}>↻</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="btn btn-ghost btn-sm text-xs text-slate-200 hover:text-white border-white/10"
            >
              ↓ EXPORT CSV
            </button>

            <Link
              href="/dashboard/builder"
              className="btn btn-primary btn-sm font-bold text-xs shadow-[0_0_20px_rgba(77,124,254,0.4)]"
            >
              + NUOVO TERMINALE
            </Link>

            {/* Profilo Utente Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-accent to-mint flex items-center justify-center text-[11px] font-extrabold text-black uppercase">
                  {userEmail.slice(0, 2) || 'CF'}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="block font-mono text-[11px] text-white truncate max-w-[130px] font-semibold">{userEmail}</span>
                  <span className="block font-mono text-[9px] text-mint uppercase font-bold">PIANO FREE</span>
                </div>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#0E1320] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 font-mono text-xs">
                  <div className="p-2 border-b border-white/10 mb-1">
                    <span className="text-slate-400 text-[10px] block">Autenticato come:</span>
                    <span className="text-white font-bold truncate block">{userEmail}</span>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block w-full text-left p-2 rounded hover:bg-white/5 text-slate-300 hover:text-white"
                  >
                    ⚙ Impostazioni Account
                  </Link>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left p-2 rounded hover:bg-rose/10 text-rose font-bold cursor-pointer"
                  >
                    Disconnetti Sessione
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ========================================== */}
        {/* 2. INTESTAZIONE DI STATO                   */}
        {/* ========================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
              <span>AGGIORNATO AL {currentDateFormatted}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
              Registro operativo
            </h1>
          </div>
          <div className="font-mono text-xs text-slate-400 flex items-center gap-2">
            <span>SESSIONE:</span>
            <span className="text-slate-200 font-semibold">{userEmail}</span>
            <span className="chip !text-[9px] !py-0.5 text-amber border-amber/30">FREE</span>
          </div>
        </div>

        {/* ========================================== */}
        {/* 3. GUIDA ONBOARDING IN 3 STEP (CHIUDIBILE) */}
        {/* ========================================== */}
        {showOnboarding && (
          <div className="p-6 rounded-2xl bg-[#0E1322] border border-accent/30 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🚀</span>
                <h3 className="font-bold text-white text-base">Come iniziare con CalcFlow in 3 semplici passaggi:</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboarding(false)}
                className="text-slate-400 hover:text-white font-mono text-xs cursor-pointer px-2 py-1 rounded hover:bg-white/5"
              >
                ✕ Chiudi Guida
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-1 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="font-mono text-xs font-bold text-accent-hi block uppercase tracking-wider">PASSO 1</span>
                <h4 className="font-bold text-white text-sm">Configura il Calcolatore</h4>
                <p className="leading-relaxed text-slate-400">
                  Clicca sul pulsante blu <strong>+ Nuovo Terminale</strong>. Imposta i cursori, i campi numerici e seleziona una delle nostre formule con 1 click.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="font-mono text-xs font-bold text-mint block uppercase tracking-wider">PASSO 2</span>
                <h4 className="font-bold text-white text-sm">Incorpora nel tuo Sito</h4>
                <p className="leading-relaxed text-slate-400">
                  Apri l'anteprima, clicca su <strong>Codice Embed &lt;/&gt;</strong> e incolla il blocco HTML su WordPress, Webflow, Shopify o nel codice sorgente.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="font-mono text-xs font-bold text-amber block uppercase tracking-wider">PASSO 3</span>
                <h4 className="font-bold text-white text-sm">Ricevi Contatti Qualificati</h4>
                <p className="leading-relaxed text-slate-400">
                  Quando il visitatore richiede il preventivo, i suoi dati compaiono qui in tabella con tutti i parametri esatti del preventivo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 4. I 4 BLOCCHI KPI CON SPARKLINES SVG      */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Terminali */}
          <div className="panel p-6 border-white/10 bg-[#0C1019] relative overflow-hidden flex flex-col justify-between h-44 shadow-lg">
            <div>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] tracking-wider uppercase mb-2">
                <span>TERMINALI</span>
                <span className="text-slate-500">⊞</span>
              </div>
              <div className="font-mono text-4xl font-extrabold text-white tracking-tight">
                {metrics.totalCalcs}
              </div>
              <div className="font-mono text-[10px] text-accent-hi uppercase tracking-widest mt-1 font-semibold">
                {metrics.onlineCalcs} ONLINE · PIANO FREE
              </div>
            </div>
            <div className="pt-2">
              <svg className="w-full h-10 overflow-visible" viewBox="0 0 220 44">
                <path
                  d={generateSparklinePath(sparklineCalcs, 220, 44)}
                  fill="none"
                  stroke="#4D7CFE"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 2: Lead Acquisiti */}
          <div className="panel p-6 border-white/10 bg-[#0C1019] relative overflow-hidden flex flex-col justify-between h-44 shadow-lg">
            <div>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] tracking-wider uppercase mb-2">
                <span>LEAD ACQUISITI</span>
                <span className="text-slate-500">👤</span>
              </div>
              <div className="font-mono text-4xl font-extrabold text-white tracking-tight">
                {metrics.totalLeads}
              </div>
              <div className="font-mono text-[10px] text-mint uppercase tracking-widest mt-1 font-semibold">
                CONTATTI VALIDATI
              </div>
            </div>
            <div className="pt-2">
              <svg className="w-full h-10 overflow-visible" viewBox="0 0 220 44">
                <path
                  d={generateSparklinePath(sparklineLeads, 220, 44)}
                  fill="none"
                  stroke="#2CE0A5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 3: Media Lead / Terminale */}
          <div className="panel p-6 border-white/10 bg-[#0C1019] relative overflow-hidden flex flex-col justify-between h-44 shadow-lg">
            <div>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] tracking-wider uppercase mb-2">
                <span>LEAD / TERMINALE</span>
                <span className="text-slate-500">↗</span>
              </div>
              <div className="font-mono text-4xl font-extrabold text-white tracking-tight">
                {metrics.leadsPerCalc}
              </div>
              <div className="font-mono text-[10px] text-cyan uppercase tracking-widest mt-1 font-semibold">
                MEDIA CORRENTE
              </div>
            </div>
            <div className="pt-2">
              <svg className="w-full h-10 overflow-visible" viewBox="0 0 220 44">
                <path
                  d={generateSparklinePath(sparklineAvg, 220, 44)}
                  fill="none"
                  stroke="#4CC9FF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 4: Ultimo Lead */}
          <div className="panel p-6 border-white/10 bg-[#0C1019] relative overflow-hidden flex flex-col justify-between h-44 shadow-lg">
            <div>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] tracking-wider uppercase mb-2">
                <span>ULTIMO LEAD</span>
                <span className="text-slate-500">⏱</span>
              </div>
              <div className="font-mono text-4xl font-extrabold text-white tracking-tight">
                {metrics.lastLeadTimeText}
              </div>
              <div className="font-mono text-[10px] text-amber uppercase tracking-widest mt-1 font-semibold">
                {metrics.lastLeadSub}
              </div>
            </div>
            <div className="pt-2">
              <svg className="w-full h-10 overflow-visible" viewBox="0 0 220 44">
                <path
                  d={generateSparklinePath(sparklineTime, 220, 44)}
                  fill="none"
                  stroke="#FFB224"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 5. TABELLA: TERMINALI DI CALCOLO           */}
        {/* ========================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-sm">🎛</span>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-200">
                TERMINALI DI CALCOLO
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                N. {calculators.length}
              </span>
              <Link
                href="/dashboard/builder"
                className="btn btn-primary btn-sm !py-1 text-xs font-bold"
              >
                + NUOVO
              </Link>
            </div>
          </div>

          <div className="panel overflow-hidden border-white/10 bg-[#0C1019] rounded-2xl shadow-xl">
            {calculators.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-slate-400 font-mono text-sm">Nessun terminale configurato al momento.</p>
                <Link href="/dashboard/builder" className="btn btn-primary btn-sm font-bold">
                  Crea il tuo primo calcolatore
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {calculators.map((c, index) => (
                  <div
                    key={c.id}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-white text-base tracking-tight">{c.title}</h3>
                          <span className={`badge ${c.is_published ? 'badge-mint' : 'badge-amber'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.is_published ? 'bg-mint' : 'bg-amber'}`} />
                            {c.is_published ? 'ONLINE' : 'IN PAUSA'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
                          <span>ID <code className="text-accent-hi font-semibold">{c.id.slice(0, 8).toUpperCase()}</code></span>
                          <span>·</span>
                          <span>creato il {new Date(c.created_at).toLocaleDateString('it-IT')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/builder?id=${c.id}`}
                        className="btn btn-ghost btn-sm font-mono text-xs uppercase"
                      >
                        MODIFICA
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c.id, c.is_published)}
                        className="btn btn-ghost btn-sm font-mono text-xs uppercase text-slate-300 hover:text-white cursor-pointer"
                      >
                        {c.is_published ? 'PAUSA' : 'ATTIVA'}
                      </button>
                      <Link
                        href={`/embed/${c.id}`}
                        target="_blank"
                        className="btn btn-soft btn-sm font-mono text-xs uppercase text-accent-hi"
                      >
                        ANTEPRIMA ↗
                      </Link>
                      <button
                        type="button"
                        onClick={() => setCalcToDelete(c)}
                        className="btn btn-ghost btn-sm font-mono text-xs uppercase text-rose hover:bg-rose/10 cursor-pointer"
                      >
                        ELIMINA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========================================== */}
        {/* 6. TABELLA: FLUSSO LEAD IN INGRESSO        */}
        {/* ========================================== */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-md bg-mint/10 border border-mint/30 flex items-center justify-center text-mint text-xs">
                📥
              </span>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-200">
                FLUSSO LEAD IN INGRESSO
              </h2>
              <span className="chip !py-0 text-[10px] text-mint border-mint/30 font-bold font-mono">
                {filteredLeads.length} RECORD
              </span>
            </div>

            {/* Controlli Filtro & Ricerca */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <input
                type="text"
                value={searchLeadQuery}
                onChange={(e) => setSearchLeadQuery(e.target.value)}
                placeholder="Cerca nome o email..."
                className="field text-xs !py-1 !w-48 bg-[#0C1019] border-white/10 text-slate-200"
              />

              <div className="flex items-center gap-2">
                <span className="text-slate-400">FILTRO:</span>
                <select
                  value={selectedCalcFilter}
                  onChange={(e) => setSelectedCalcFilter(e.target.value)}
                  className="field text-xs !py-1 !w-auto bg-[#0C1019] border-white/10 text-slate-200"
                >
                  <option value="all">Tutti i terminali ({leads.length})</option>
                  {calculators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="panel overflow-x-auto border-white/10 bg-[#0C1019] rounded-2xl shadow-xl">
            {filteredLeads.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                Nessun contatto registrato per i criteri di ricerca selezionati.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-white/10 text-slate-400 bg-black/40 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 font-semibold">DATA / ORA</th>
                    <th className="p-4 font-semibold">TERMINALE</th>
                    <th className="p-4 font-semibold">CONTATTO</th>
                    <th className="p-4 font-semibold">ATTRIBUZIONE (UTM / REFERRER)</th>
                    <th className="p-4 font-semibold">TELEMETRIA CALCOLO</th>
                    <th className="p-4 font-semibold text-right">DETTAGLI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeads.map((lead) => {
                    const leadDate = new Date(lead.created_at);
                    return (
                      <tr key={lead.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4 whitespace-nowrap text-slate-300">
                          <span className="font-bold text-white block">
                            {leadDate.toLocaleDateString('it-IT')}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {leadDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} · adesso
                          </span>
                        </td>
                        <td className="p-4 text-white font-bold whitespace-nowrap">
                          {calcTitleMap[lead.calculator_id] || 'Terminale Sconosciuto'}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-bold text-white block">
                            {lead.contact_data?.fullName || 'Anonimo'}
                          </span>
                          <a
                            href={`mailto:${lead.contact_data?.email}`}
                            className="text-accent-hi hover:underline text-[11px]"
                          >
                            {lead.contact_data?.email}
                          </a>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-amber uppercase text-[9px] font-bold">
                              {lead.device_type || 'DESKTOP'}
                            </span>
                            <span className="text-slate-300 text-[11px]">
                              {lead.utm_source || 'Diretto'}
                            </span>
                          </div>
                          {lead.page_url && (
                            <span className="block text-[10px] text-slate-500 truncate max-w-xs font-sans">
                              {lead.page_url}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {Object.entries(lead.calculation_state?.results || {}).map(([k, v]) => (
                              <span
                                key={k}
                                className="px-2 py-0.5 rounded bg-mint/10 border border-mint/20 text-[10px] text-mint"
                              >
                                {k}: <strong>{v}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="btn btn-ghost btn-sm text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
                          >
                            Ispeziona 🔍
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>

      {/* ========================================== */}
      {/* 7. MODALE ISPEZIONE COMPLETA LEAD          */}
      {/* ========================================== */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-in fade-in">
          <div className="panel p-6 max-w-2xl w-full space-y-5 border-white/10 bg-[#0E1320] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">Scheda Telemetrica Lead</h3>
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {selectedLead.id} · Ricevuto il {new Date(selectedLead.created_at).toLocaleString('it-IT')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Nome Contatto</span>
                <span className="text-white font-bold block">{selectedLead.contact_data?.fullName || 'Non specificato'}</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Email Contatto</span>
                <a href={`mailto:${selectedLead.contact_data?.email}`} className="text-accent-hi underline font-bold block truncate">
                  {selectedLead.contact_data?.email}
                </a>
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                Parametri Selezionati dal Visitatore (Input):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(selectedLead.calculation_state?.inputs || {}).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">{k}</span>
                    <span className="text-white font-bold text-sm">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                Totali Finanziari Stimati (Output):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedLead.calculation_state?.results || {}).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-lg bg-mint/10 border border-mint/30">
                    <span className="text-[10px] text-mint block">{k}</span>
                    <span className="text-white font-extrabold text-lg">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Sorgente: <strong className="text-slate-200">{selectedLead.utm_source || 'Diretto'}</strong></div>
              <div>Dispositivo: <strong className="text-slate-200">{selectedLead.device_type || 'desktop'}</strong></div>
              {selectedLead.page_url && (
                <div className="truncate">URL Pagina: <span className="text-slate-300">{selectedLead.page_url}</span></div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="btn btn-primary btn-sm font-bold cursor-pointer"
              >
                Chiudi Scheda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 8. MODALE CONFERMA ELIMINAZIONE CALCOLATORE */}
      {/* ========================================== */}
      {calcToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-in fade-in">
          <div className="panel p-6 max-w-md w-full space-y-4 border-rose/30 bg-[#120B0F] shadow-2xl">
            <h3 className="text-base font-bold text-rose">Eliminare questo terminale?</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Sei sicuro di voler eliminare <strong>"{calcToDelete.title}"</strong>? L'eventuale codice embed incorporato sul tuo sito smetterà di funzionare.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setCalcToDelete(null)}
                className="btn btn-ghost btn-sm text-xs cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={confirmDeleteCalculator}
                className="btn btn-primary btn-sm !bg-rose hover:!bg-rose-600 text-white font-bold text-xs cursor-pointer"
              >
                Conferma Eliminazione
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}