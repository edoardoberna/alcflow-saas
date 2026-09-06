'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';
import { supabase } from '@/lib/supabase';

/* ==========================================================================
   INTERFACCE
   ========================================================================== */

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

/* ==========================================================================
   ICONE VETTORIALI
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
const IconClock = ({ className, size = 14 }: IconProps) => (
  <svg {...base(size)} className={className}><circle cx="10" cy="10" r="7" /><path d="M10 6v4.2l2.8 1.6" /></svg>
);
const IconGrid = ({ className, size = 14 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="3" width="6" height="6" rx="1" /><rect x="11" y="3" width="6" height="6" rx="1" />
    <rect x="3" y="11" width="6" height="6" rx="1" /><rect x="11" y="11" width="6" height="6" rx="1" />
  </svg>
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
const IconRatio = ({ className, size = 14 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M4 16 16 4M16 4h-5M16 4v5M4 16h5M4 16v-5" /></svg>
);

function Mark({ className = 'text-accent', size = 20 }: IconProps & { className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M10 1.5 18 6v8l-8 4.5L2 14V6l8-4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 1.5V10m0 0 8-4m-8 4-8-4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" opacity="0.5" />
      <path d="M10 10v8.5L18 14V6" fill="currentColor" fillOpacity="0.15" stroke="none" />
    </svg>
  );
}

/* ==========================================================================
   FORMATTAZIONE & DETERMINISTIC PRNG
   ========================================================================== */

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

const formatNumber = (n: number) =>
  n.toLocaleString('it-IT', { maximumFractionDigits: 2 });

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
   KPI CARD
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
   PAGINA DASHBOARD
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
    window.setTimeout(() => setToast(null), 2600);
  };

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
      showToast(newStatus ? `"${calc.title}" è online` : `"${calc.title}" messo in pausa`);
    }
    setActionLoadingId(null);
  };

  const handleDeleteCalculator = async (calc: CalculatorItem) => {
    if (!confirm(`Confermi l'eliminazione di "${calc.title}"? L'operazione è irreversibile.`)) return;

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
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRefresh = async () => {
    if (!currentUser) return;
    await fetchDashboardData(currentUser.id);
    showToast('Dati aggiornati dal registro');
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

    showToast(`Registro esportato — ${filteredLeads.length} lead`);
  };

  const onlineCount = calculators.filter((c) => c.is_published).length;
  const ratio = calculators.length > 0 ? (leads.length / calculators.length).toFixed(1).replace('.', ',') : '0,0';
  const lastLead = leads[0] ?? null;

  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-ink">
        <header className="fixed top-0 inset-x-0 z-50 bg-void/80 backdrop-blur-xl border-b border-line">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 h-[60px] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mark size={21} />
              <span className="font-mono text-[15px] font-bold tracking-[0.08em]">CALCFLOW</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              <span className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              Caricamento registro
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-5 lg:px-8 pt-[100px] pb-20 space-y-6">
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
          <div className="panel p-6 space-y-4">
            <div className="skeleton h-3 w-40" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-12 w-full" />
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

      <header className="fixed top-0 inset-x-0 z-50 bg-void/80 backdrop-blur-xl border-b border-line">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-[60px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="flex items-center gap-2.5">
              <Mark size={21} />
              <span className="font-mono text-[15px] font-bold tracking-[0.08em]">CALCFLOW</span>
            </Link>
            <span className="hidden md:inline chip !py-0.5 !px-2 !text-[8px]">
              Console // Registro operativo
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/" className="hidden sm:inline-flex btn btn-ghost btn-sm">
              <IconArrowLeft />
              Vetrina
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
              title={filteredLeads.length === 0 ? 'Nessun lead da esportare' : 'Esporta il registro in CSV'}
              className="btn btn-primary btn-sm"
            >
              <IconDownload />
              Export CSV
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

      <main className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-[100px] pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10 anim-fade-up">
          <div>
            <span className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              <span className="dot-live" />
              Aggiornato al {today}
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Registro operativo
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-faint truncate max-w-xs">
            <span className="uppercase tracking-[0.16em]">Sessione:</span>
            <span className="text-muted truncate">{currentUser?.email}</span>
            <span className={`badge ${userPlan === 'pro' ? 'badge-accent' : 'badge-amber'} ml-1`}>
              {userPlan}
            </span>
          </div>
        </div>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <KpiCard
            icon={IconGrid}
            label="Terminali"
            value={String(calculators.length)}
            meta={`${onlineCount} online · piano ${userPlan}`}
            metaTone="accent"
            sparkSeed={7}
            sparkColor="#4D7CFE"
            fillId="spark-calc"
            delay={0}
          />
          <KpiCard
            icon={IconLead}
            label="Lead acquisiti"
            value={String(leads.length)}
            meta="contatti validati"
            metaTone="mint"
            sparkSeed={13}
            sparkColor="#2CE0A5"
            fillId="spark-leads"
            delay={60}
          />
          <KpiCard
            icon={IconRatio}
            label="Lead / terminale"
            value={ratio}
            meta="media corrente"
            metaTone="faint"
            sparkSeed={29}
            sparkColor="#4CC9FF"
            fillId="spark-ratio"
            delay={120}
          />
          <KpiCard
            icon={IconClock}
            label="Ultimo lead"
            value={lastLead ? timeAgo(lastLead.created_at) : '—'}
            meta={lastLead ? formatTime(lastLead.created_at) : 'nessun dato'}
            metaTone="amber"
            sparkSeed={41}
            sparkColor="#FFB224"
            fillId="spark-last"
            delay={180}
          />
        </section>

        <section className="mb-12 anim-fade-up" style={{ animationDelay: '220ms' }}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg border border-accent/25 bg-accent/[0.08] text-accent-hi flex items-center justify-center">
                <IconSliders />
              </span>
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
                Terminali di calcolo
              </h2>
            </div>
            <span className="chip">N. {calculators.length}</span>
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
                  Crea il primo calcolatore dalla console per iniziare a raccogliere lead.
                </p>
                <Link href="/" className="btn btn-soft btn-sm mt-5">
                  Vai alla vetrina
                  <IconArrowUpRight />
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
                      <span className="font-mono text-[10px] text-faint tabular w-6 flex-none">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-[14px] font-semibold text-ink group-hover:text-accent-hi transition-colors truncate">
                            {calc.title}
                          </h3>
                          <span className={`badge ${calc.is_published ? 'badge-mint' : 'badge-amber'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${calc.is_published ? 'bg-mint' : 'bg-amber'}`} />
                            {calc.is_published ? 'Online' : 'In pausa'}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] tracking-[0.1em] text-faint">
                          ID {calc.id.slice(0, 8).toUpperCase()} · creato il {formatDate(calc.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap md:flex-none">
                      <button
                        onClick={() => handleTogglePublish(calc)}
                        disabled={actionLoadingId === calc.id}
                        className="btn btn-ghost btn-sm"
                      >
                        {calc.is_published ? 'Pausa' : 'Attiva'}
                      </button>
                      <Link href={`/embed/${calc.id}`} target="_blank" className="btn btn-soft btn-sm">
                        Anteprima
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

        <section className="anim-fade-up" style={{ animationDelay: '280ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="relative flex w-8 h-8 items-center justify-center rounded-lg border border-mint/25 bg-mint/[0.07] text-mint">
                <IconInbox size={14} />
              </span>
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
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
                  Pubblica un terminale: i lead compariranno qui in tempo reale.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] min-w-[760px]">
                  <thead>
                    <tr className="border-b border-line bg-white/[0.02] font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
                      <th className="px-5 py-3 font-medium">Data / Ora</th>
                      <th className="px-5 py-3 font-medium">Terminale</th>
                      <th className="px-5 py-3 font-medium">Contatto</th>
                      <th className="px-5 py-3 font-medium">Email</th>
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
                        <td className="px-5 py-3.5 text-ink/90">
                          {lead.contact_data?.fullName || (
                            <span className="text-faint italic">Anonimo</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-accent-hi whitespace-nowrap">
                          {lead.contact_data?.email || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {lead.calculation_state?.results &&
                              Object.entries(lead.calculation_state.results).map(([key, val]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-baseline gap-1.5 rounded-md border border-line bg-raised px-2 py-1 font-mono text-[10px] text-faint"
                                >
                                  {key}
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