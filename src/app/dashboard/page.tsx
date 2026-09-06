'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';
import { supabase } from '@/lib/supabase';

interface CalculatorItem {
  id: string;
  title: string;
  is_published: boolean;
  created_at: string;
}

interface LeadItem {
  id: string;
  calculator_id: string;
  created_at: string;
  contact_data: {
    fullName?: string;
    email?: string;
  };
  calculation_state: {
    inputs?: Record<string, number>;
    results?: Record<string, number>;
  };
}

function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="text-forest" aria-hidden="true">
      <rect x="1.5" y="1.5" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 13.5 13.5 4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.5" cy="5.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 6"
      width="10"
      height="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className}
      aria-hidden="true"
    >
      <path d="m1 1 4 4 4-4" />
    </svg>
  );
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('it-IT');

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [calculators, setCalculators] = useState<CalculatorItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalc, setSelectedCalc] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      if (profile?.plan) {
        setUserPlan(profile.plan as 'free' | 'pro');
      }

      await fetchDashboardData(user.id);
    }
    checkAuthAndLoad();
  }, [router]);

  const fetchDashboardData = async (userId: string) => {
    setLoading(true);

    const { data: calcsData } = await supabase
      .from('calculators')
      .select('id, title, is_published, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (calcsData) setCalculators(calcsData);
    if (leadsData) setLeads(leadsData);

    setLoading(false);
  };

  const handleTogglePublish = async (calc: CalculatorItem) => {
    setActionLoadingId(calc.id);
    const newStatus = !calc.is_published;

    const { error } = await supabase
      .from('calculators')
      .update({ is_published: newStatus })
      .eq('id', calc.id)
      .eq('user_id', currentUser.id);

    if (!error) {
      setCalculators((prev) =>
        prev.map((c) => (c.id === calc.id ? { ...c, is_published: newStatus } : c))
      );
    }
    setActionLoadingId(null);
  };

  const handleDeleteCalculator = async (calc: CalculatorItem) => {
    if (!confirm(`Confermi l'eliminazione del terminale "${calc.title}"?`)) return;

    setActionLoadingId(calc.id);
    const { error } = await supabase
      .from('calculators')
      .delete()
      .eq('id', calc.id)
      .eq('user_id', currentUser.id);

    if (!error) {
      setCalculators((prev) => prev.filter((c) => c.id !== calc.id));
      setLeads((prev) => prev.filter((l) => l.calculator_id !== calc.id));
    }
    setActionLoadingId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const filteredLeads = selectedCalc === 'all'
    ? leads
    : leads.filter((l) => l.calculator_id === selectedCalc);

  const calcMap = new Map(calculators.map((c) => [c.id, c.title]));

  const exportToCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ['Timestamp', 'Calculator', 'Contact', 'Email', 'Inputs', 'Calculated_Outputs'];
    const rows = filteredLeads.map((l) => {
      const date = new Date(l.created_at).toISOString();
      const calcTitle = calcMap.get(l.calculator_id) || l.calculator_id;
      const name = l.contact_data?.fullName || '';
      const email = l.contact_data?.email || '';
      const inputs = JSON.stringify(l.calculation_state?.inputs || {}).replace(/"/g, '""');
      const results = JSON.stringify(l.calculation_state?.results || {}).replace(/"/g, '""');
      return `"${date}","${calcTitle}","${name}","${email}","${inputs}","${results}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `calcflow_leads_${Date.now()}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-paper gap-5">
        <div className="flex items-center gap-2.5">
          <Mark />
          <span className="font-serif text-lg font-semibold tracking-tight text-ink">CalcFlow</span>
        </div>
        <div className="w-56 h-[2px] bg-ink/10 overflow-hidden">
          <div className="loading-bar h-full w-1/4 bg-forest" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-faint">
          Apertura del registro…
        </span>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const ratio = calculators.length > 0 ? (leads.length / calculators.length).toFixed(1).replace('.', ',') : '0,0';

  return (
    <div className="min-h-screen text-ink">
      {/* Testata */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-paper/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2.5">
              <Mark />
              <span className="font-serif text-lg font-semibold tracking-tight">CalcFlow</span>
            </Link>
            <span className="hidden md:inline border-l border-hairline-strong pl-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              Registro operativo
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="btn-mini hidden sm:inline-flex items-center">← Vetrina</Link>
            <button
              onClick={exportToCSV}
              disabled={filteredLeads.length === 0}
              title={filteredLeads.length === 0 ? 'Nessun lead da esportare' : 'Esporta il registro in formato CSV'}
              className="btn btn-forest btn-sm"
            >
              Esporta CSV
            </button>
            <div className="pl-3 border-l border-hairline">
              <UserAvatar
                email={currentUser?.email}
                plan={userPlan}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-24">

        {/* Intestazione di pagina */}
        <div className="pt-12 pb-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
                <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
                Dati aggiornati al {today}
              </span>
              <h1 className="display mt-4 text-4xl sm:text-5xl text-ink">Registro operativo</h1>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint max-w-[260px] leading-relaxed sm:text-right truncate">
              Sessione: {currentUser?.email} — Piano: {userPlan}
            </p>
          </div>
        </div>

        {/* Estratto conto: tre voci */}
        <section className="border-y-4 border-double border-ink/40">
          <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-hairline">
            <div className="py-7 sm:pr-10">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                Calcolatori configurati
              </span>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="display text-[3.25rem] leading-none text-ink">{calculators.length}</span>
                <span className="border border-hairline-strong px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                  {userPlan}
                </span>
              </div>
            </div>
            <div className="py-7 sm:px-10">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                Lead acquisiti
              </span>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="display text-[3.25rem] leading-none text-forest">{leads.length}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">contatti validati</span>
              </div>
            </div>
            <div className="py-7 sm:pl-10">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                Lead per terminale
              </span>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="display text-[3.25rem] leading-none text-ink">{ratio}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">media corrente</span>
              </div>
            </div>
          </div>
        </section>

        {/* Terminali di calcolo */}
        <section className="mt-14 mb-16">
          <div className="flex items-baseline justify-between gap-4 border-b-4 border-double border-ink/40 pb-3">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
              Terminali di calcolo
            </h2>
            <span className="font-mono text-[10px] text-ink-faint">N. {calculators.length}</span>
          </div>

          {calculators.length === 0 ? (
            <div className="mt-6 border border-dashed border-hairline-strong/70 px-6 py-14 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
                Nessun terminale in registro
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                Crea il primo calcolatore per iniziare a raccogliere lead qualificati.
              </p>
            </div>
          ) : (
            <div>
              {calculators.map((calc, i) => (
                <div
                  key={calc.id}
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-4 py-5 border-b border-hairline"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-serif italic text-sm text-ink-faint w-7 flex-none">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-serif text-lg font-medium text-ink group-hover:text-forest transition-colors truncate">
                          {calc.title}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${
                            calc.is_published
                              ? 'border-forest/35 text-forest bg-forest/[0.06]'
                              : 'border-seal/35 text-seal bg-seal/[0.05]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${calc.is_published ? 'bg-forest' : 'bg-seal/70'}`} />
                          {calc.is_published ? 'Online' : 'In pausa'}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] tracking-wide text-ink-faint">
                        ID {calc.id.slice(0, 8).toUpperCase()} · istituito il {formatDate(calc.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap md:flex-none">
                    <button
                      onClick={() => handleTogglePublish(calc)}
                      disabled={actionLoadingId === calc.id}
                      className="btn-mini"
                    >
                      {calc.is_published ? 'Metti in pausa' : 'Attiva'}
                    </button>
                    <Link href={`/embed/${calc.id}`} target="_blank" className="link-mono">
                      Anteprima
                    </Link>
                    <button
                      onClick={() => handleDeleteCalculator(calc)}
                      disabled={actionLoadingId === calc.id}
                      className="btn-mini btn-mini-seal"
                    >
                      Elimina
                    </button>
                    {actionLoadingId === calc.id && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint animate-pulse">
                        in scrittura…
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Flusso lead in ingresso */}
        <section className="bg-paper-raised border border-ink/25 shadow-[6px_6px_0_0_rgba(31,29,24,0.05)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-hairline">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-forest" />
              </span>
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
                Flusso lead in ingresso
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <label htmlFor="lead-filter" className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
                Filtro
              </label>
              <div className="relative">
                <select
                  id="lead-filter"
                  value={selectedCalc}
                  onChange={(e) => setSelectedCalc(e.target.value)}
                  className="field-ink !w-auto appearance-none py-1.5 pl-3 pr-8 text-[11px] cursor-pointer"
                >
                  <option value="all">Tutti i terminali ({leads.length})</option>
                  {calculators.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <ChevronIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-faint" />
              </div>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="px-6 py-16 text-center border-t border-hairline">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
                Nessuna voce in registro
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                Pubblica un calcolatore: i lead compariranno qui in tempo reale.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-ink/[0.04] font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft border-b border-hairline">
                    <th className="px-4 py-3 font-medium">Data / Ora</th>
                    <th className="px-4 py-3 font-medium">Terminale</th>
                    <th className="px-4 py-3 font-medium">Contatto</th>
                    <th className="px-4 py-3 font-medium">E-mail</th>
                    <th className="px-4 py-3 font-medium">Telemetria calcolo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-hairline last:border-b-0 hover:bg-forest/[0.05] transition-colors align-top">
                      <td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft whitespace-nowrap">
                        {formatDate(lead.created_at)}
                        <span className="text-ink-faint"> · {formatTime(lead.created_at)}</span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-ink whitespace-nowrap">
                        {calcMap.get(lead.calculator_id) || lead.calculator_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3.5 text-ink">
                        {lead.contact_data?.fullName || <span className="text-ink-faint italic">Anonimo</span>}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-forest whitespace-nowrap">
                        {lead.contact_data?.email || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {lead.calculation_state?.results &&
                            Object.entries(lead.calculation_state.results).map(([key, val]) => (
                              <span
                                key={key}
                                className="inline-flex items-baseline gap-1 border border-hairline bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-soft"
                              >
                                {key}
                                <span className="font-semibold text-ink">
                                  {typeof val === 'number' ? val.toLocaleString('it-IT') : String(val)}
                                </span>
                              </span>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}