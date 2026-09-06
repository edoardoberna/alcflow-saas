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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#06080D] gap-3 font-mono">
        <div className="w-8 h-8 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400">CONNECTING TO DATA TERMINAL...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080D] text-slate-100 bg-tech-grid p-6 md:p-10 font-sans selection:bg-[#00F0FF] selection:text-[#06080D]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs text-[#00F0FF]">
              <span className="w-2 h-2 rounded-full bg-[#00F59B] animate-pulse"></span>
              <span>TERMINAL // ANALYTICS &amp; TELEMETRY</span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              Data Operations Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-[#101623] hover:bg-[#161E2E] border border-white/10 text-xs font-mono text-slate-200 rounded-lg transition"
            >
              ← LANDING PAGE
            </Link>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-[#00F0FF] hover:bg-[#00D8E6] text-[#06080D] text-xs font-mono font-bold rounded-lg transition uppercase tracking-wider cursor-pointer"
            >
              EXPORT CSV ↗
            </button>
            <div className="pl-2 border-l border-white/10">
              <UserAvatar
                email={currentUser?.email}
                plan={userPlan}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>

        {/* Bento Metrics Arkham Style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="p-5 rounded-2xl terminal-panel border border-white/10">
            <div className="flex justify-between items-center text-[11px] text-slate-500 uppercase">
              <span>ACTIVE CALCULATORS</span>
              <span className="text-[#00F0FF]">{userPlan.toUpperCase()}</span>
            </div>
            <p className="text-3xl font-black text-white font-tabular mt-2">{calculators.length}</p>
          </div>

          <div className="p-5 rounded-2xl terminal-panel border border-white/10">
            <span className="text-[11px] text-slate-500 uppercase block">TOTAL LEADS ACQUIRED</span>
            <p className="text-3xl font-black text-[#00F59B] font-tabular mt-2">{leads.length}</p>
          </div>

          <div className="p-5 rounded-2xl terminal-panel border border-white/10">
            <span className="text-[11px] text-slate-500 uppercase block">AVERAGE CAPTURE RATIO</span>
            <p className="text-3xl font-black text-[#00F0FF] font-tabular mt-2">
              {calculators.length > 0 ? (leads.length / calculators.length).toFixed(1) : '0.0'}
            </p>
          </div>
        </div>

        {/* Tabella Calcolatori */}
        <div className="terminal-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">
              CONFIGURED ENGINE TERMINALS
            </span>
            <span className="text-xs font-mono text-slate-500">COUNT: {calculators.length}</span>
          </div>

          <div className="divide-y divide-white/5">
            {calculators.map((calc) => (
              <div key={calc.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{calc.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      calc.is_published ? 'bg-[#00F59B]/10 text-[#00F59B] border border-[#00F59B]/20' : 'bg-amber-950/40 text-[#FFB800] border border-[#FFB800]/20'
                    }`}>
                      {calc.is_published ? '● ONLINE' : '○ PAUSED'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">ID: {calc.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublish(calc)}
                    disabled={actionLoadingId === calc.id}
                    className="text-xs px-3 py-1.5 rounded border border-white/10 hover:bg-[#101623] text-slate-300 transition cursor-pointer"
                  >
                    {calc.is_published ? 'PAUSE' : 'ACTIVATE'}
                  </button>
                  <Link
                    href={`/embed/${calc.id}`}
                    target="_blank"
                    className="text-xs px-3 py-1.5 rounded bg-[#101623] border border-white/10 text-[#00F0FF] hover:bg-[#161E2E] transition"
                  >
                    PREVIEW ↗
                  </Link>
                  <button
                    onClick={() => handleDeleteCalculator(calc)}
                    disabled={actionLoadingId === calc.id}
                    className="text-xs px-3 py-1.5 rounded text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High-Density Live Feed dei Lead (Arkham Transaction Feed) */}
        <div className="terminal-panel rounded-2xl border border-white/10 overflow-hidden font-mono">
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping"></span>
              <span className="text-xs font-bold uppercase text-slate-200">INCOMING LEAD FEED</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-500">FILTER:</label>
              <select
                value={selectedCalc}
                onChange={(e) => setSelectedCalc(e.target.value)}
                className="bg-[#101623] text-slate-300 border border-white/10 rounded px-2.5 py-1 text-xs focus:outline-none"
              >
                <option value="all">ALL TERMINALS ({leads.length})</option>
                {calculators.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              NO INCOMING ENTRIES DETECTED IN STREAM.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#101623]/60 text-slate-400 border-b border-white/5 text-[11px]">
                    <th className="p-3">TIMESTAMP</th>
                    <th className="p-3">TARGET ENGINE</th>
                    <th className="p-3">ENTITY</th>
                    <th className="p-3">COMMUNICATION</th>
                    <th className="p-3">COMPUTED TELEMETRY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleTimeString('it-IT')}
                      </td>
                      <td className="p-3 font-bold text-white">
                        {calcMap.get(lead.calculator_id) || lead.calculator_id.slice(0, 8)}
                      </td>
                      <td className="p-3 text-slate-300">
                        {lead.contact_data?.fullName || 'ANONYMOUS'}
                      </td>
                      <td className="p-3 text-[#00F0FF]">
                        {lead.contact_data?.email || 'N/A'}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {lead.calculation_state?.results &&
                            Object.entries(lead.calculation_state.results).map(([key, val]) => (
                              <span
                                key={key}
                                className="px-1.5 py-0.5 rounded bg-[#101623] text-[#00F59B] border border-white/10 text-[10px]"
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
    </div>
  );
}