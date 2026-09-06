'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [calculators, setCalculators] = useState<CalculatorItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalc, setSelectedCalc] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Carica il piano dell'utente
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

    if (error) {
      alert("Errore durante l'aggiornamento dello stato.");
    } else {
      setCalculators((prev) =>
        prev.map((c) => (c.id === calc.id ? { ...c, is_published: newStatus } : c))
      );
    }
    setActionLoadingId(null);
  };

  const handleDeleteCalculator = async (calc: CalculatorItem) => {
    const confirmDelete = window.confirm(
      `Sei sicuro di voler eliminare "${calc.title}"?\n\nATTENZIONE: Questa azione cancellerà anche tutti i lead associati.`
    );
    if (!confirmDelete) return;

    setActionLoadingId(calc.id);

    const { error } = await supabase
      .from('calculators')
      .delete()
      .eq('id', calc.id)
      .eq('user_id', currentUser.id);

    if (error) {
      alert("Errore durante l'eliminazione.");
    } else {
      setCalculators((prev) => prev.filter((c) => c.id !== calc.id));
      setLeads((prev) => prev.filter((l) => l.calculator_id !== calc.id));
    }
    setActionLoadingId(null);
  };

  const handleNewCalculatorClick = (e: React.MouseEvent) => {
    if (userPlan === 'free' && calculators.length >= 1) {
      e.preventDefault();
      setShowUpgradeModal(true);
    }
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
    if (filteredLeads.length === 0) {
      alert('Nessun lead da esportare.');
      return;
    }

    const headers = ['Data', 'Calcolatore', 'Nome', 'Email', 'Dati Input', 'Risultati Calcolati'];
    
    const rows = filteredLeads.map((l) => {
      const date = new Date(l.created_at).toLocaleString('it-IT');
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
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_calcflow_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Superiore */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold text-slate-500">{currentUser?.email}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  userPlan === 'pro'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                Piano {userPlan}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Contatti & Lead</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/"
              onClick={handleNewCalculatorClick}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              + Nuovo Calcolatore
            </Link>
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
            >
              Esporta in CSV
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2.5 text-xs text-slate-400 hover:text-red-600 transition cursor-pointer font-medium"
            >
              Esci
            </button>
          </div>
        </div>

        {/* Banner Upgrade se Free */}
        {userPlan === 'free' && (
          <div className="p-4 rounded-2xl bg-linear-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Limite Piano Free Attivo</span>
              <p className="text-sm font-medium mt-0.5">
                Stai utilizzando <strong>{calculators.length} di 1</strong> calcolatore consentito. Passa a Pro per calcolatori illimitati.
              </p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 bg-white text-blue-900 font-bold text-xs rounded-xl hover:bg-blue-50 transition cursor-pointer whitespace-nowrap shadow-xs"
            >
              Passa a Pro (29€/m) →
            </button>
          </div>
        )}

        {/* Metriche */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold uppercase text-slate-400">Calcolatori</span>
              <span className="text-[10px] font-mono text-slate-400">
                {userPlan === 'free' ? `${calculators.length}/1 (Max Free)` : 'Illimitati (Pro)'}
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 mt-1">{calculators.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-400">Lead Totali Raccolti</span>
            <p className="text-3xl font-black text-blue-600 mt-1">{leads.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-400">Media Lead/Calcolatore</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {calculators.length > 0 ? (leads.length / calculators.length).toFixed(1) : '0'}
            </p>
          </div>
        </div>

        {/* Tabella Gestione Calcolatori */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">I Tuoi Calcolatori</h2>
              <p className="text-xs text-slate-500">Gestisci lo stato di pubblicazione e le integrazioni</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Totale: {calculators.length}</span>
          </div>

          {calculators.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
              Non hai ancora creato nessun calcolatore. Inizia cliccando su "+ Nuovo Calcolatore".
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {calculators.map((calc) => (
                <div key={calc.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{calc.title}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          calc.is_published
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {calc.is_published ? '● Attivo' : '○ In Pausa'}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">ID: {calc.id}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={actionLoadingId === calc.id}
                      onClick={() => handleTogglePublish(calc)}
                      className={`text-xs px-3 py-1.5 font-semibold rounded-lg border transition cursor-pointer disabled:opacity-50 ${
                        calc.is_published
                          ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {calc.is_published ? 'Metti in Pausa' : 'Attiva Widget'}
                    </button>

                    <Link
                      href={`/?id=${calc.id}`}
                      className="text-xs px-3 py-1.5 font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                    >
                      Modifica
                    </Link>

                    <Link
                      href={`/embed/${calc.id}`}
                      target="_blank"
                      className="text-xs px-3 py-1.5 font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      Embed ↗
                    </Link>

                    <button
                      disabled={actionLoadingId === calc.id}
                      onClick={() => handleDeleteCalculator(calc)}
                      className="text-xs px-3 py-1.5 font-semibold rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabella Lead Ricevuti */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">Elenco Lead Ricevuti</h2>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Filtra:</label>
              <select
                value={selectedCalc}
                onChange={(e) => setSelectedCalc(e.target.value)}
                className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Tutti i Calcolatori ({leads.length})</option>
                {calculators.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Nessun lead ancora registrato per i tuoi calcolatori.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="p-4">Data</th>
                    <th className="p-4">Calcolatore</th>
                    <th className="p-4">Nome</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Valori Calcolati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        {calcMap.get(lead.calculator_id) || 'Calcolatore'}
                      </td>
                      <td className="p-4 font-medium text-slate-900">
                        {lead.contact_data?.fullName || '—'}
                      </td>
                      <td className="p-4 text-blue-600 font-mono">
                        {lead.contact_data?.email || '—'}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {lead.calculation_state?.results &&
                            Object.entries(lead.calculation_state.results).map(([key, val]) => (
                              <span
                                key={key}
                                className="inline-block mr-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]"
                              >
                                {key}: <strong>{val?.toLocaleString('it-IT')}</strong>
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
        </div>

      </div>

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
                Hai raggiunto il limite di 1 calcolatore consentito nel piano Gratuito. Sblocca tutto il potenziale per la tua azienda.
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
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Rimozione del watermark CalcFlow</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-2xl font-black text-slate-900">
                29€ <span className="text-xs font-normal text-slate-500">/ mese</span>
              </div>

              <button
                onClick={() => {
                  alert('Integrazione Stripe Checkout pronta per essere collegata con le tue chiavi API!');
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