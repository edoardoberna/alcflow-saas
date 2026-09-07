'use client';

import React, { useEffect, useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SettingsDrawer from '@/components/SettingsDrawer';

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

// Logo Vettoriale Geometrico CalcFlow
function CalcFlowLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-none">
      <path
        d="M6 8L16 3L26 8V24L16 29L6 24V8Z"
        stroke="#4CC9FF"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 3V29"
        stroke="#4D7CFE"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 14L26 18"
        stroke="#2CE0A5"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Curva ad alta densità con ondulazioni continue (identica all'originale)
function generateSmoothWave(seed: number, count = 28, width = 260, height = 36): { linePath: string; areaPath: string } {
  const points: { x: number; y: number }[] = [];
  const step = width / (count - 1);

  for (let i = 0; i < count; i++) {
    const angle = (i * 0.5) + seed;
    const baseVariance = Math.sin(angle) * 7 + Math.cos(angle * 1.7) * 4;
    const y = Math.max(6, Math.min(height - 6, (height / 2) + baseVariance));
    points.push({ x: i * step, y });
  }

  let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    linePath += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)}, ${midX.toFixed(1)} ${((prev.y + curr.y) / 2).toFixed(1)}`;
  }
  const last = points[points.length - 1];
  linePath += ` T ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return { linePath, areaPath };
}

export default function DashboardPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [calculators, setCalculators] = useState<CalculatorRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [selectedCalcFilter, setSelectedCalcFilter] = useState<string>('all');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const loadDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email || '');

      const { data: calcsData } = await supabase
        .from('calculators')
        .select('id, title, is_published, created_at, views_count, interactions_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setCalculators(calcsData || []);

      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      setLeads(leadsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [router]);

  const metrics = useMemo(() => {
    const totalCalcs = calculators.length;
    const totalLeads = leads.length;
    const leadsPerCalc = totalCalcs > 0 ? (totalLeads / totalCalcs).toFixed(1) : '0';

    let lastLeadTimeText = 'ieri';
    let lastLeadSub = '16:06';
    if (leads.length > 0) {
      const lastDate = new Date(leads[0].created_at);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60));
      if (diffHours < 24) {
        lastLeadTimeText = 'oggi';
        lastLeadSub = lastDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      } else {
        lastLeadTimeText = 'ieri';
        lastLeadSub = lastDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      }
    }

    return { totalCalcs, totalLeads, leadsPerCalc, lastLeadTimeText, lastLeadSub };
  }, [calculators, leads]);

  const handleTogglePublished = async (calcId: string, currentStatus: boolean) => {
    startTransition(async () => {
      await supabase.from('calculators').update({ is_published: !currentStatus }).eq('id', calcId);
      loadDashboardData(true);
    });
  };

  const handleDeleteCalc = async (calcId: string) => {
    if (!confirm('Eliminare questo terminale di calcolo?')) return;
    startTransition(async () => {
      await supabase.from('calculators').delete().eq('id', calcId);
      loadDashboardData(true);
    });
  };

  const handleExportCSV = () => {
    if (!leads.length) return alert('Nessun lead disponibile per il download.');
    const headers = ['Data / Ora', 'Terminale ID', 'Nome', 'Email', 'Dispositivo', 'Sorgente', 'Dati Input', 'Risultati'];
    const rows = leads.map(l => [
      new Date(l.created_at).toLocaleString('it-IT'),
      l.calculator_id,
      `"${l.contact_data?.fullName || ''}"`,
      `"${l.contact_data?.email || ''}"`,
      l.device_type || 'desktop',
      `"${l.utm_source || 'Diretto'}"`,
      `"${JSON.stringify(l.calculation_state?.inputs || {})}"`,
      `"${JSON.stringify(l.calculation_state?.results || {})}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `calcflow_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const filteredLeads = selectedCalcFilter === 'all'
    ? leads
    : leads.filter(l => l.calculator_id === selectedCalcFilter);

  const calcMap = useMemo(() => {
    const m: Record<string, string> = {};
    calculators.forEach(c => { m[c.id] = c.title; });
    return m;
  }, [calculators]);

  // Curve grafiche per ciascun KPI
  const wave1 = useMemo(() => generateSmoothWave(1.2), []);
  const wave2 = useMemo(() => generateSmoothWave(3.8), []);
  const wave3 = useMemo(() => generateSmoothWave(2.1), []);
  const wave4 = useMemo(() => generateSmoothWave(5.4), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-white">
        <span className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-3" />
        <p className="font-mono text-xs uppercase tracking-widest text-slate-400">Caricamento Registro Operativo…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-white p-4 sm:p-8 font-sans selection:bg-accent/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER SUPERIORE */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <CalcFlowLogo />
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xl font-black tracking-widest text-white">CALCFLOW</span>
              <span className="chip text-[10px] font-mono text-slate-400">CONSOLE // REGISTRO</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="btn btn-ghost btn-sm text-xs font-mono text-slate-300 hover:text-white">
              ← VETRINA
            </Link>

            <Link
              href="/dashboard/builder"
              className="btn btn-primary btn-sm !px-5 font-bold text-xs shadow-[0_0_20px_rgba(77,124,254,0.4)]"
            >
              + NUOVO TERMINALE
            </Link>

            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              title="Ricarica Dati"
              className="btn btn-ghost btn-sm text-slate-300 hover:text-white p-2"
            >
              <span className={`inline-block ${refreshing ? 'animate-spin' : ''}`}>↻</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="btn btn-ghost btn-sm text-xs font-mono text-slate-200 hover:text-white"
            >
              ↓ EXPORT CSV
            </button>

            {/* Menu Utente Profilo */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-accent to-mint flex items-center justify-center text-[10px] font-black text-black uppercase">
                  {userEmail.slice(0, 2) || 'EB'}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="block font-mono text-[11px] text-white truncate max-w-[130px]">{userEmail}</span>
                  <span className="block font-mono text-[8px] text-mint uppercase font-bold">PIANO FREE</span>
                </div>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#0E1320] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <span>⚙</span> Il tuo Account & Hub
                  </button>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      document.cookie = 'calcflow_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                      router.push('/login');
                    }}
                    className="w-full text-left p-2 rounded hover:bg-rose/10 text-rose font-bold cursor-pointer"
                  >
                    Disconnetti
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* TITOLO REGISTRO */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
              <span>AGGIORNATO AL LUNEDÌ 7 SETTEMBRE 2026</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mt-1">
              Registro operativo
            </h1>
          </div>
          <div className="font-mono text-xs text-slate-400 flex items-center gap-2">
            <span>SESSIONE:</span>
            <span className="text-slate-200">{userEmail}</span>
            <span className="chip !text-[9px] !py-0.5 text-amber border-amber/30">FREE</span>
          </div>
        </div>

        {/* GUIDA IN 3 PASSI (CHIUDIBILE) */}
        {showOnboarding && (
          <div className="p-6 rounded-2xl bg-[#0E1322] border border-accent/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🚀</span>
                <h3 className="font-bold text-white text-base">Come iniziare con CalcFlow in 3 passaggi:</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboarding(false)}
                className="text-slate-400 hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕ Chiudi Guida
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-1 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="font-mono text-xs font-bold text-accent-hi block uppercase">PASSO 1</span>
                <h4 className="font-bold text-white text-sm">Configura il Calcolatore</h4>
                <p className="leading-relaxed text-slate-400">
                  Clicca su <strong>+ Nuovo Terminale</strong>. Imposta gli slider e le formule con i template veloci a 1-click.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="font-mono text-xs font-bold text-mint block uppercase">PASSO 2</span>
                <h4 className="font-bold text-white text-sm">Incolla sul tuo Sito</h4>
                <p className="leading-relaxed text-slate-400">
                  Clicca su <strong>Codice Embed &lt;/&gt;</strong> e incolla il blocco HTML nel tuo WordPress, Webflow o sito web.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="font-mono text-xs font-bold text-amber block uppercase">PASSO 3</span>
                <h4 className="font-bold text-white text-sm">Raccogli i Contatti</h4>
                <p className="leading-relaxed text-slate-400">
                  I visitatori inseriscono l'email per sbloccare la stima: i contatti compariranno qui sotto in tempo reale.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4 BLOCCHI KPI CON GRAFICI A ONDA VESTITI (COME ORIGINALE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Terminali */}
          <div className="panel p-6 border-white/10 bg-[#0C1019] relative overflow-hidden flex flex-col justify-between h-44 rounded-2xl">
            <div>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] tracking-wider uppercase mb-1">
                <span>TERMINALI</span>
                <span className="text-slate-500">⊞</span>
              </div>
              <div className="font-mono text-4xl font-extrabold text-white tracking-tight">
                {metrics.totalCalcs}
              </div>
              <div className="font-mono text-[10px] text-accent-hi uppercase tracking-widest mt-1">
                {metrics.totalCalcs} ONLINE · PIANO FREE
              </div>
            </div>
            <div className="w-full -mb-2">
              <svg className="w-full h-9 overflow-visible" viewBox="0 0 260 36">
                <defs>
                  <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4D7CFE" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4D7CFE" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={wave1.areaPath} fill="url(#grad-blue)" />
                <path d={wave1.linePath} fill="none" stroke="#4D7CFE" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 2: Lead Acquisiti */}
          <div className="panel p-6 border-white/10 bg-[#0C1019] relative overflow-hidden flex flex-col justify-between h-44 rounded-2xl">
            <div>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] tracking-wider uppercase mb-1">
                <span>LEAD ACQUISITI</span>
                <span className="text-slate-500">👤</span>
              </div>
              <div className="font-mono text-4xl font-extrabold text-white tracking-tight">
                {metrics.totalLeads}
              </div>
              <div className="font-mono text-[10px] text-mint uppercase tracking-widest mt-1">
                CONTATTI VALIDATI
              </div>
            </div>
            <div className="w-full -mb-2">
              <svg className="w-full h-9 overflow-visible" viewBox="0 0 260 36">
                <defs>
                  <linearGradient id="grad-mint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2CE0A5" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#2CE0A5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={wave2.areaPath} fill="url(#grad-mint)" />
                <path d={wave2.linePath} fill="none" stroke="#2CE0A5" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 3: Lead / Terminale */}
          <div className="panel p-6 border-white/10 bg-[#0C1019] relative overflow-hidden flex flex-col justify-between h-44 rounded-2xl">
            <div>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] tracking-wider uppercase mb-1">
                <span>LEAD / TERMINALE</span>
                <span className="text-slate-500">↗</span>
              </div>
              <div className="font-mono text-4xl font-extrabold text-white tracking-tight">
                {metrics.leadsPerCalc}
              </div>
              <div className="font-mono text-[10px] text-cyan uppercase tracking-widest mt-1">
                MEDIA CORRENTE
              </div>
            </div>
            <div className="w-full -mb-2">
              <svg className="w-full h-9 overflow-visible" viewBox="0 0 260 36">
                <defs>
                  <linearGradient id="grad-cyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4CC9FF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4CC9FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={wave3.areaPath} fill="url(#grad-cyan)" />
                <path d={wave3.linePath} fill="none" stroke="#4CC9FF" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 4: Ultimo Lead */}
          <div className="panel p-6 border-white/10 bg-[#0C1019] relative overflow-hidden flex flex-col justify-between h-44 rounded-2xl">
            <div>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] tracking-wider uppercase mb-1">
                <span>ULTIMO LEAD</span>
                <span className="text-slate-500">⏱</span>
              </div>
              <div className="font-mono text-4xl font-extrabold text-white tracking-tight">
                {metrics.lastLeadTimeText}
              </div>
              <div className="font-mono text-[10px] text-amber uppercase tracking-widest mt-1">
                {metrics.lastLeadSub}
              </div>
            </div>
            <div className="w-full -mb-2">
              <svg className="w-full h-9 overflow-visible" viewBox="0 0 260 36">
                <defs>
                  <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFB224" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FFB224" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={wave4.areaPath} fill="url(#grad-amber)" />
                <path d={wave4.linePath} fill="none" stroke="#FFB224" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

        </div>

        {/* TABELLA TERMINALI */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span>🎛</span>
              <h2>TERMINALI DI CALCOLO</h2>
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

          <div className="panel overflow-hidden border-white/10 bg-[#0C1019] rounded-2xl shadow-xl divide-y divide-white/5">
            {calculators.map((c, i) => (
              <div key={c.id} className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-white/[0.02] transition">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-base">{c.title}</h3>
                      <span className={`badge ${c.is_published ? 'badge-mint' : 'badge-amber'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.is_published ? 'bg-mint' : 'bg-amber'}`} />
                        {c.is_published ? 'ONLINE' : 'IN PAUSA'}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-400 mt-1">
                      ID <code className="text-accent-hi">{c.id.slice(0, 8).toUpperCase()}</code> · creato il{' '}
                      {new Date(c.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <Link href={`/dashboard/builder?id=${c.id}`} className="btn btn-ghost btn-sm uppercase">
                    MODIFICA
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleTogglePublished(c.id, c.is_published)}
                    className="btn btn-ghost btn-sm uppercase text-slate-300 hover:text-white"
                  >
                    {c.is_published ? 'PAUSA' : 'ATTIVA'}
                  </button>
                  <Link href={`/embed/${c.id}`} target="_blank" className="btn btn-soft btn-sm uppercase text-accent-hi">
                    ANTEPRIMA ↗
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteCalc(c.id)}
                    className="btn btn-ghost btn-sm uppercase text-rose hover:bg-rose/10"
                  >
                    ELIMINA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TABELLA FLUSSO LEAD */}
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

            <div className="flex items-center gap-2 text-xs font-mono">
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

          <div className="panel overflow-x-auto border-white/10 bg-[#0C1019] rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-white/10 text-slate-400 bg-black/40 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 font-semibold">DATA / ORA</th>
                  <th className="p-4 font-semibold">TERMINALE</th>
                  <th className="p-4 font-semibold">CONTATTO</th>
                  <th className="p-4 font-semibold">ATTRIBUZIONE (UTM / REFERRER)</th>
                  <th className="p-4 font-semibold">TELEMETRIA CALCOLO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLeads.map((lead) => {
                  const d = new Date(lead.created_at);
                  return (
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-4 whitespace-nowrap text-slate-300">
                        <span className="font-bold text-white block">{d.toLocaleDateString('it-IT')}</span>
                        <span className="text-[10px] text-slate-500">
                          {d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} · adesso
                        </span>
                      </td>
                      <td className="p-4 text-white font-bold whitespace-nowrap">
                        {calcMap[lead.calculator_id] || 'Preventivatore Servizi'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-white block">{lead.contact_data?.fullName || 'edoardo'}</span>
                        <a href={`mailto:${lead.contact_data?.email}`} className="text-accent-hi hover:underline text-[11px]">
                          {lead.contact_data?.email}
                        </a>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge badge-amber uppercase text-[9px] font-bold">
                            {lead.device_type || 'DESKTOP'}
                          </span>
                          <span className="text-slate-300 text-[11px]">{lead.utm_source || 'Diretto'}</span>
                        </div>
                        {lead.page_url && (
                          <span className="block text-[10px] text-slate-500 truncate max-w-xs font-sans">
                            {lead.page_url}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {Object.entries(lead.calculation_state?.inputs || {}).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300">
                              {k}: <strong className="text-white">{v}</strong>
                            </span>
                          ))}
                          {Object.entries(lead.calculation_state?.results || {}).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 rounded bg-mint/10 border border-mint/20 text-[10px] text-mint">
                              {k}: <strong>{v}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* PANNELLO LATERALE IMPOSTAZIONI (NESSUN 404) */}
      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userEmail={userEmail}
      />
    </div>
  );
}