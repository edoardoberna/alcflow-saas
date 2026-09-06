'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';
import { supabase } from '@/lib/supabase';

/* ==========================================================================
   INTERFACCE COMPLETE (OPERATIVE + ANALITICHE)
   ========================================================================== */

interface CalculatorItem {
  id: string;
  title: string;
  is_published: boolean;
  views_count?: number;
  interactions_count?: number;
  outputs?: { variable: string; highlight?: boolean }[];
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
  page_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  device_type?: string;
}

/* ==========================================================================
   ICONE VETTORIALI INLINE
   ========================================================================== */

type IconProps = { className?: string; size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 20 20',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const
});

const IconArrowUpRight = ({ className, size = 11 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M5 15 15 5M7 5h8v8" /></svg>
);
const IconArrowLeft = ({ className, size = 12 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M15 10H5m0 0 4-4m-4 4 4 4" /></svg>
);
const IconChevronDown = ({ className, size = 12 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="m5 8 5 5 5-5" /></svg>
);
const IconDownload = ({ className, size = 13 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 16.5h12" /></svg>
);
const IconRefresh = ({ className, size = 13 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M16 10a6 6 0 1 1-1.76-4.24M16 3v3.5h-3.5" /></svg>
);
const IconTrend = ({ className, size = 14 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="m3 14 5-5 4 4 5-7M13 6h4v4" /></svg>
);
const IconCoins = ({ className, size = 14 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <ellipse cx="10" cy="6" rx="6" ry="3" /><path d="M4 6v8c0 1.66 2.69 3 6 3s6-1.34 6-3V6" /><path d="M4 10c0 1.66 2.69 3 6 3s6-1.34 6-3" />
  </svg>
);
const IconPie = ({ className, size = 14 }: IconProps) => (
  <svg {...base(size)} className={className}><circle cx="10" cy="10" r="7" /><path d="M10 3v7h7" /></svg>
);
const IconInbox = ({ className, size = 26 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 11.5 5.5 4h9L17 11.5V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.5Z" />
    <path d="M3 11.5h4l1 2h4l1-2h4" />
  </svg>
);
const IconSliders = ({ className, size = 14 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M5 3v5.5M5 12v5M10 3v2.5M10 9v8M15 3v8.5M15 15v2" />
    <circle cx="5" cy="10.5" r="1.6" /><circle cx="10" cy="7.5" r="1.6" /><circle cx="15" cy="13.5" r="1.6" />
  </svg>
);
const IconLead = ({ className, size = 14 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="10" cy="7" r="3" /><path d="M4.5 16.5c.8-2.8 2.9-4.2 5.5-4.2s4.7 1.4 5.5 4.2" />
  </svg>
);

function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-none drop-shadow-[0_0_10px_rgba(77,124,254,0.4)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dashSigmaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4D7CFE" />
          <stop offset="45%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2CE0A5" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill="#080C14" />
      <rect width="496" height="496" x="8" y="8" rx="112" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="10" />
      <path d="M 380 144 H 156 L 262 256 L 156 368 H 336" fill="none" stroke="url(#dashSigmaGrad)" strokeWidth="52" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 285 316 L 378 368 L 285 420" fill="none" stroke="#2CE0A5" strokeWidth="52" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="262" cy="256" r="26" fill="#FFFFFF" />
    </svg>
  );
}

/* ==========================================================================
   FORMATTAZIONI & STATISTICA QUANTITATIVA
   ========================================================================== */

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

const formatNumber = (n: number) =>
  n.toLocaleString('it-IT', { maximumFractionDigits: 2 });

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

function timeAgo(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat('it-IT', { numeric: 'auto' });
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'adesso';
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, 'day');
  return formatDate(iso);
}

function calculateMedian(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function makeRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function Sparkline({
  seed, stroke, fillId, className = ''
}: {
  seed: number; stroke: string; fillId: string; className?: string;
}) {
  const path = useMemo(() => {
    const rnd = makeRandom(seed);
    const points: [number, number][] = [];
    const LEN = 26;
    for (let i = 0; i < LEN; i++) {
      const noise = rnd();
      const trend = 0.3 + (i / LEN) * 0.45;
      const v = Math.min(1, trend * 0.7 + noise * 0.35);
      points.push([(i / (LEN - 1)) * 100, 30 - v * 22 - 2]);
    }
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
      .join(' ');
  }, [seed]);

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={`w-full h-8 ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L100,32 L0,32 Z`} fill={`url(#${fillId})`} stroke="none" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

/* ==========================================================================
   KPI CARD CON SPARKLINE VETTORIALE
   ========================================================================== */

function KpiCard({
  icon: Icon,
  label,
  value,
  meta,
  metaTone = 'faint',
  sparkSeed,
  sparkColor,
  fillId,
  delay = 0
}: {
  icon: React.ComponentType<IconProps>;
  label: string;
  value: string;
  meta: string;
  metaTone?: 'faint' | 'mint' | 'amber' | 'accent';
  sparkSeed: number;
  sparkColor: string;
  fillId: string;
  delay?: number;
}) {
  const toneClass =
    metaTone === 'mint' ? 'text-mint'
    : metaTone === 'amber' ? 'text-amber'
    : metaTone === 'accent' ? 'text-accent-hi'
    : 'text-faint';

  return (
    <div
      className="panel panel-hover relative overflow-hidden p-5 anim-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="edge-light" />
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
          {label}
        </span>
        <span className="w-7 h-7 rounded-lg border border-line bg-raised text-muted flex items-center justify-center flex-none">
          <Icon size={13} />
        </span>
      </div>

      <div className="mt-3 font-mono tabular text-[2.2rem] leading-none font-bold text-ink">
        {value}
      </div>

      <div className={`mt-2 font-mono text-[9px] uppercase tracking-[0.16em] ${toneClass}`}>
        {meta}
      </div>

      <div className="mt-3 -mx-1 opacity-80">
        <Sparkline seed={sparkSeed} stroke={sparkColor} fillId={fillId} />
      </div>
    </div>
  );
}

/* ==========================================================================
   COMPONENTE PRINCIPALE DASHBOARD
   ========================================================================== */

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [calculators, setCalculators] = useState<CalculatorItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalc, setSelectedCalc] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Assicura cookie auth attivo durante la sessione
      document.cookie = "calcflow_auth=true; path=/; max-age=604800; SameSite=Lax";

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
      .select('id, title, is_published, views_count, interactions_count, outputs, created_at')
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
      showToast(newStatus ? `"${calc.title}" è online` : `"${calc.title}" messo in pausa`);
    }
    setActionLoadingId(null);
  };

  const handleDeleteCalculator = async (calc: CalculatorItem) => {
    if (!confirm(`Confermi l'eliminazione definitiva del terminale "${calc.title}"?`)) return;

    setActionLoadingId(calc.id);
    const { error } = await supabase
      .from('calculators')
      .delete()
      .eq('id', calc.id)
      .eq('user_id', currentUser.id);

    if (!error) {
      setCalculators((prev) => prev.filter((c) => c.id !== calc.id));
      setLeads((prev) => prev.filter((l) => l.calculator_id !== calc.id));
      showToast(`"${calc.title}" eliminato dal registro`);
    }
    setActionLoadingId(null);
  };

  const handleLogout = async () => {
    document.cookie = "calcflow_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRefresh = async () => {
    if (!currentUser) return;
    await fetchDashboardData(currentUser.id);
    showToast('Dati sincronizzati con il database');
  };

  const filteredLeads = useMemo(() => {
    return selectedCalc === 'all'
      ? leads
      : leads.filter((l) => l.calculator_id === selectedCalc);
  }, [leads, selectedCalc]);

  const calcMap = useMemo(() => new Map(calculators.map((c) => [c.id, c.title])), [calculators]);

  // Aggregazioni Analitiche
  const analytics = useMemo(() => {
    const totalViews = calculators.reduce((acc, c) => acc + (c.views_count || 0), 0);
    const totalLeadsCount = leads.length;
    const cr = totalViews > 0 ? ((totalLeadsCount / totalViews) * 100).toFixed(1) : '0.0';

    const dealValues: number[] = [];
    leads.forEach((l) => {
      const res = l.calculation_state?.results;
      if (res && typeof res === 'object') {
        const vals = Object.values(res).filter((v) => typeof v === 'number' && isFinite(v));
        if (vals.length > 0) dealValues.push(vals[0]);
      }
    });

    const pipelineTotal = dealValues.reduce((acc, v) => acc + v, 0);
    const medianDeal = calculateMedian(dealValues);

    return {
      totalViews,
      cr,
      pipelineTotal,
      medianDeal
    };
  }, [calculators, leads]);

  // Export CSV Normalizzato (Unnesting completo)
  const exportToCSV = () => {
    if (filteredLeads.length === 0) return;

    const inputKeys = new Set<string>();
    const outputKeys = new Set<string>();

    filteredLeads.forEach((l) => {
      if (l.calculation_state?.inputs) {
        Object.keys(l.calculation_state.inputs).forEach((k) => inputKeys.add(k));
      }
      if (l.calculation_state?.results) {
        Object.keys(l.calculation_state.results).forEach((k) => outputKeys.add(k));
      }
    });

    const sortedInputKeys = Array.from(inputKeys).sort();
    const sortedOutputKeys = Array.from(outputKeys).sort();

    const headers = [
      'Timestamp',
      'Calculator_ID',
      'Calculator_Title',
      'Full_Name',
      'Email',
      'Device',
      'UTM_Source',
      'UTM_Medium',
      'UTM_Campaign',
      'Host_Referrer',
      ...sortedInputKeys.map((k) => `inp_${k}`),
      ...sortedOutputKeys.map((k) => `out_${k}`)
    ];

    const rows = filteredLeads.map((l) => {
      const row = [
        new Date(l.created_at).toISOString(),
        l.calculator_id,
        calcMap.get(l.calculator_id) || '',
        l.contact_data?.fullName || '',
        l.contact_data?.email || '',
        l.device_type || 'desktop',
        l.utm_source || '',
        l.utm_medium || '',
        l.utm_campaign || '',
        l.page_url || ''
      ];

      sortedInputKeys.forEach((k) => {
        const val = l.calculation_state?.inputs?.[k];
        row.push(val !== undefined ? String(val) : '');
      });

      sortedOutputKeys.forEach((k) => {
        const val = l.calculation_state?.results?.[k];
        row.push(val !== undefined ? String(val) : '');
      });

      return row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `calcflow_analytics_${Date.now()}.csv`;
    link.click();

    showToast(`Esportate ${filteredLeads.length} righe normalizzate per BI`);
  };

  const onlineCount = calculators.filter((c) => c.is_published).length;
  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-ink">
        <header className="fixed top-0 inset-x-0 z-50 bg-void/80 backdrop-blur-xl border-b border-line">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 h-[64px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mark size={28} />
              <span className="font-mono text-[16px] font-bold tracking-[0.08em]">CALCFLOW</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              <span className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              Caricamento telemetria
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-5 lg:px-8 pt-[104px] pb-20 space-y-6">
          <div className="space-y-3">
            <div className="skeleton h-3 w-48" />
            <div className="skeleton h-8 w-80" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="panel p-5 space-y-4">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-9 w-20" />
                <div className="skeleton h-8 w-full" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-ink antialiased selection:bg-accent/30">
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-grid opacity-40" style={{ maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent 70%)' }} />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-accent/[0.06] blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-void/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-[64px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link href="/" className="flex items-center gap-2.5">
              <Mark size={28} />
              <span className="font-mono text-[16px] font-bold tracking-[0.08em] text-white">CALCFLOW</span>
            </Link>
            <span className="hidden md:inline chip !py-0.5 !px-2 !text-[9px] text-slate-300">
              Intelligence Console
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/" className="hidden sm:inline-flex btn btn-ghost btn-sm text-slate-300 hover:text-white">
              <IconArrowLeft />
              Vetrina
            </Link>

            <Link href="/dashboard/builder" className="btn btn-primary btn-sm">
              + Nuovo Terminale
            </Link>

            <button
              onClick={handleRefresh}
              className="btn-icon"
              title="Ricarica i dati dal registro"
              aria-label="Ricarica i dati"
            >
              <IconRefresh />
            </button>

            <button
              onClick={exportToCSV}
              disabled={filteredLeads.length === 0}
              title={filteredLeads.length === 0 ? 'Nessun lead da esportare' : 'Esporta il registro normalizzato per Excel / BI'}
              className="btn btn-ghost btn-sm text-slate-300 hover:text-white"
            >
              <IconDownload />
              Export BI (CSV)
            </button>

            <div className="pl-2.5 border-l border-line">
              <UserAvatar
                email={currentUser?.email}
                plan={userPlan}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-[104px] pb-24">
        {/* Intestazione */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10 anim-fade-up">
          <div>
            <span className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              <span className="dot-live" />
              Sincronizzato al {today}
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Rapporto Economico e Telemetria
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-faint truncate max-w-xs">
            <span className="uppercase tracking-[0.16em]">Sessione:</span>
            <span className="text-slate-300 truncate">{currentUser?.email}</span>
            <span className={`badge ${userPlan === 'pro' ? 'badge-accent' : 'badge-amber'} ml-1`}>
              {userPlan}
            </span>
          </div>
        </div>

        {/* Griglia KPI Economici e Funnel con Sparklines */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <KpiCard
            icon={IconCoins}
            label="Pipeline Valutata"
            value={formatCurrency(analytics.pipelineTotal)}
            meta="valore preventivi generati"
            metaTone="accent"
            sparkSeed={11}
            sparkColor="#4D7CFE"
            fillId="spark-pipe"
            delay={0}
          />
          <KpiCard
            icon={IconPie}
            label="Valore Mediano"
            value={formatCurrency(analytics.medianDeal)}
            meta="ticket tipico (no outlier)"
            metaTone="mint"
            sparkSeed={23}
            sparkColor="#2CE0A5"
            fillId="spark-med"
            delay={60}
          />
          <KpiCard
            icon={IconTrend}
            label="Conversion Rate"
            value={`${analytics.cr}%`}
            meta={`${analytics.totalViews} impressioni registrate`}
            metaTone="amber"
            sparkSeed={37}
            sparkColor="#FFB224"
            fillId="spark-cr"
            delay={120}
          />
          <KpiCard
            icon={IconLead}
            label="Lead Acquisiti"
            value={String(leads.length)}
            meta={`${onlineCount}/${calculators.length} terminali online`}
            metaTone="faint"
            sparkSeed={47}
            sparkColor="#4CC9FF"
            fillId="spark-leads"
            delay={180}
          />
        </section>

        {/* Sezione Terminali di Calcolo (Operativa Completa) */}
        <section className="mb-12 anim-fade-up" style={{ animationDelay: '220ms' }}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg border border-accent/25 bg-accent/[0.08] text-accent-hi flex items-center justify-center">
                <IconSliders />
              </span>
              <h2 className="font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-ink">
                Terminali di calcolo
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="chip">N. {calculators.length}</span>
              <Link href="/dashboard/builder" className="btn btn-primary btn-sm !py-1 !px-3 text-xs">
                + Nuovo
              </Link>
            </div>
          </div>

          <div className="panel overflow-hidden">
            {calculators.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-12 h-12 mx-auto rounded-xl border border-line bg-raised text-faint flex items-center justify-center mb-4">
                  <IconSliders size={20} />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
                  Nessun terminale in registro
                </p>
                <p className="mt-2 text-[13px] text-muted">
                  Crea il primo calcolatore per iniziare a tracciare impressioni e lead.
                </p>
                <Link href="/dashboard/builder" className="btn btn-primary btn-sm mt-5">
                  + Crea il primo terminale
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {calculators.map((calc, i) => (
                  <div
                    key={calc.id}
                    className="group flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-[11px] text-faint tabular w-6 flex-none">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-[15px] font-semibold text-ink group-hover:text-accent-hi transition-colors truncate">
                            {calc.title}
                          </h3>
                          <span className={`badge ${calc.is_published ? 'badge-mint' : 'badge-amber'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${calc.is_published ? 'bg-mint' : 'bg-amber'}`} />
                            {calc.is_published ? 'Online' : 'In pausa'}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] tracking-[0.1em] text-faint">
                          ID {calc.id.slice(0, 8).toUpperCase()} · creato il {formatDate(calc.created_at)} · {calc.views_count || 0} visualizzazioni · {calc.interactions_count || 0} interazioni
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap md:flex-none">
                      <Link
                        href={`/dashboard/builder?id=${calc.id}`}
                        className="btn btn-ghost btn-sm text-slate-300 hover:text-white"
                      >
                        Modifica
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(calc)}
                        disabled={actionLoadingId === calc.id}
                        className="btn btn-ghost btn-sm text-slate-300 hover:text-white"
                      >
                        {calc.is_published ? 'Pausa' : 'Attiva'}
                      </button>
                      <Link href={`/embed/${calc.id}`} target="_blank" className="btn btn-soft btn-sm">
                        Embed
                        <IconArrowUpRight />
                      </Link>
                      <button
                        onClick={() => handleDeleteCalculator(calc)}
                        disabled={actionLoadingId === calc.id}
                        className="btn btn-danger btn-sm"
                      >
                        Elimina
                      </button>
                      {actionLoadingId === calc.id && (
                        <span className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Flusso Lead con Attribuzione e Dettagli Calcolo */}
        <section className="anim-fade-up" style={{ animationDelay: '280ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="relative flex w-8 h-8 items-center justify-center rounded-lg border border-mint/25 bg-mint/[0.07] text-mint">
                <IconInbox size={14} />
              </span>
              <h2 className="font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-ink">
                Flusso lead in ingresso
              </h2>
              <span className="badge badge-mint">{filteredLeads.length} record</span>
            </div>

            <div className="flex items-center gap-2.5">
              <label htmlFor="lead-filter" className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
                Filtro
              </label>
              <div className="relative">
                <select
                  id="lead-filter"
                  value={selectedCalc}
                  onChange={(e) => setSelectedCalc(e.target.value)}
                  className="field field-mono !w-auto !py-1.5 !pl-3 !pr-8 !text-[11px]"
                >
                  <option value="all">Tutti i terminali ({leads.length})</option>
                  {calculators.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <IconChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-faint" />
              </div>
            </div>
          </div>

          <div className="panel overflow-hidden">
            {filteredLeads.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="w-12 h-12 mx-auto rounded-xl border border-line bg-raised text-faint flex items-center justify-center mb-4">
                  <IconInbox size={20} />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
                  Nessuna voce nel flusso
                </p>
                <p className="mt-2 text-[13px] text-muted">
                  Pubblica un terminale: i lead compilati dai visitatori compariranno qui in tempo reale con le metriche di attribuzione.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] min-w-[900px]">
                  <thead>
                    <tr className="border-b border-line bg-white/[0.02] font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
                      <th className="px-5 py-3 font-medium">Data / Ora</th>
                      <th className="px-5 py-3 font-medium">Terminale</th>
                      <th className="px-5 py-3 font-medium">Contatto</th>
                      <th className="px-5 py-3 font-medium">Attribuzione (UTM / Referrer)</th>
                      <th className="px-5 py-3 font-medium">Telemetria calcolo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-accent/[0.03] transition-colors align-top"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="font-mono text-[11px] text-ink tabular">
                            {formatDate(lead.created_at)}
                          </div>
                          <div className="font-mono text-[9px] text-faint mt-0.5">
                            {formatTime(lead.created_at)} · {timeAgo(lead.created_at)}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-ink whitespace-nowrap">
                          {calcMap.get(lead.calculator_id) || lead.calculator_id.slice(0, 8)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-ink">
                            {lead.contact_data?.fullName || <span className="text-faint italic">Anonimo</span>}
                          </div>
                          <div className="font-mono text-[11px] text-accent-hi">
                            {lead.contact_data?.email || '—'}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="badge badge-amber uppercase text-[9px]">
                              {lead.device_type || 'desktop'}
                            </span>
                            {lead.utm_source ? (
                              <span className="badge badge-accent text-[9px]">{lead.utm_source}</span>
                            ) : (
                              <span className="text-faint text-[10px]">Diretto</span>
                            )}
                            {lead.utm_campaign && (
                              <span className="text-slate-400 text-[10px]">cmp: {lead.utm_campaign}</span>
                            )}
                          </div>
                          {lead.page_url && (
                            <div className="text-faint text-[9px] truncate max-w-xs mt-1" title={lead.page_url}>
                              {lead.page_url}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {lead.calculation_state?.results &&
                              Object.entries(lead.calculation_state.results).map(([key, val]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-baseline gap-1.5 rounded-md border border-line bg-raised px-2 py-1 font-mono text-[10px] text-faint"
                                >
                                  {key}:
                                  <span className="font-semibold text-mint tabular">
                                    {typeof val === 'number' ? formatNumber(val) : String(val)}
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
          </div>
        </section>
      </main>

      {/* Toast Notifiche */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[60] anim-pop panel !bg-overlay border-line-strong px-4 py-3 flex items-center gap-3 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.8)]"
        >
          <span className="w-5 h-5 rounded-full bg-mint/15 border border-mint/40 text-mint flex items-center justify-center flex-none text-[10px]">
            ✓
          </span>
          <span className="font-mono text-[11px] tracking-wide text-ink">{toast}</span>
        </div>
      )}
    </div>
  );
}