'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import CalculatorPreview from '@/components/CalculatorPreview';

/* ==========================================================================
   ICONE INLINE
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
const IconChevronDown = ({ className, size = 12 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="m5 8 5 5 5-5" /></svg>
);
const IconCheck = ({ className, size = 12 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="m4 10.5 4 4 8-9" /></svg>
);
const IconX = ({ className, size = 12 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="m5 5 10 10M15 5 5 15" /></svg>
);
const IconMenu = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M3 6h14M3 10h14M3 14h14" /></svg>
);
const IconClose = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="m5 5 10 10M15 5 5 15" /></svg>
);
const IconCopy = ({ className, size = 14 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="7" y="7" width="9" height="9" rx="1.5" /><path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7" />
  </svg>
);
const IconShield = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M10 2.5 16 5v5c0 4-2.7 6.5-6 7.5C6.7 16.5 4 14 4 10V5l6-2.5Z" /><path d="m7.5 10 1.8 1.8 3.4-3.6" />
  </svg>
);
const IconBolt = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M11 2.5 5 11h4l-1 6.5L14 9h-4l1-6.5Z" /></svg>
);
const IconCode = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="m7 6-4 4 4 4M13 6l4 4-4 4" /></svg>
);
const IconWebhook = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M8 12.5a3.5 3.5 0 1 1 3.2-4.9M12.5 12a3.5 3.5 0 1 1-1.8 6.5" />
    <circle cx="13" cy="6.5" r="2.6" /><circle cx="6.5" cy="14.5" r="2.6" /><circle cx="13.5" cy="15" r="2.6" />
  </svg>
);
const IconActivity = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M2.5 10h3l2-5 3.5 10 2.5-5h4" /></svg>
);
const IconSliders = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M5 3v5.5M5 12v5M10 3v2.5M10 9v8M15 3v8.5M15 15v2" />
    <circle cx="5" cy="10.5" r="1.6" /><circle cx="10" cy="7.5" r="1.6" /><circle cx="15" cy="13.5" r="1.6" />
  </svg>
);
const IconInbox = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 11.5 5.5 4h9L17 11.5V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.5Z" />
    <path d="M3 11.5h4l1 2h4l1-2h4" />
  </svg>
);

/* Logo Ufficiale Sigma-Flow */
function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="flex-none">
      <defs>
        <linearGradient id="siteSigmaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4D7CFE" />
          <stop offset="45%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2CE0A5" />
        </linearGradient>
      </defs>
      <path
        d="M23.5 9H9.5L16.2 16L9.5 23H20.5"
        stroke="url(#siteSigmaGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 19.5L22.5 23L17.5 26.5"
        stroke="#2CE0A5"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16.2" cy="16" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

/* ==========================================================================
   HOOKS
   ========================================================================== */

function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function useTilt(max = 5) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`);
  }, [max]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}

/* ==========================================================================
   CANVAS 3D FIBONACCI
   ========================================================================== */

function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let disposed = false;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const N = 190;
    const LINK_DIST = 62;

    const golden = Math.PI * (3 - Math.sqrt(5));
    const pts: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = golden * i;
      pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r });
    }

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      mouse.tx = (e.clientX - rect.left) / rect.width - 0.5;
      mouse.ty = (e.clientY - rect.top) / rect.height - 0.5;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * DPR));
      canvas.height = Math.max(1, Math.floor(rect.height * DPR));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let t = Math.random() * 100;

    const draw = () => {
      if (disposed) return;
      const w = canvas.width / DPR;
      const h = canvas.height / DPR;

      t += 0.0021;
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h * 0.52;
      const R = Math.min(w, h) * 0.34;

      const ay = t + mouse.x * 0.7;
      const ax = 0.38 + Math.sin(t * 0.6) * 0.22 + mouse.y * 0.5;
      const cA = Math.cos(ax), sA = Math.sin(ax);
      const cB = Math.cos(ay), sB = Math.sin(ay);

      const proj: { sx: number; sy: number; z: number }[] = new Array(N);
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const y1 = p.y * cA - p.z * sA;
        const z1 = p.y * sA + p.z * cA;
        const x2 = p.x * cB + z1 * sB;
        const z2 = -p.x * sB + z1 * cB;
        const persp = 2.6 / (2.6 - z2);
        proj[i] = { sx: cx + x2 * R * persp, sy: cy + y1 * R * persp, z: z2 };
      }

      ctx.lineWidth = 1;
      const maxD2 = LINK_DIST * LINK_DIST;
      for (let i = 0; i < N; i++) {
        const a = proj[i];
        for (let j = i + 1; j < N; j++) {
          const b = proj[j];
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxD2) {
            const depth = ((a.z + b.z) / 2 + 1) / 2;
            const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.14 * (0.3 + depth * 0.7);
            ctx.strokeStyle = `rgba(90, 130, 255, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < N; i++) {
        const p = proj[i];
        const depth = (p.z + 1) / 2;
        const r = 0.5 + depth * 1.5;
        ctx.fillStyle = `rgba(140, 170, 255, ${(0.1 + depth * 0.5).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fill();
        if (depth > 0.93) {
          ctx.fillStyle = 'rgba(150, 180, 255, 0.95)';
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}

/* ==========================================================================
   COMPONENTI AUSILIARI
   ========================================================================== */

function ScrollProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const on = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setP(max > 0 ? el.scrollTop / max : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);

  return (
    <div
      className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-accent via-cyan to-mint"
      style={{ transform: `scaleX(${p})` }}
      aria-hidden="true"
    />
  );
}

function Stat({
  value, decimals = 0, prefix = '', suffix = '', className = ''
}: {
  value: number; decimals?: number; prefix?: string; suffix?: string; className?: string;
}) {
  const { ref, visible } = useReveal<HTMLSpanElement>(0.4);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value);
      return;
    }
    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setN(value * eased);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible, value]);

  return (
    <span ref={ref} className={`tabular ${className}`}>
      {prefix}
      {n.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const tilt = useTilt(4);
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`panel panel-hover tilt relative overflow-hidden p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function FaqItem({
  index, question, answer, open, onToggle
}: {
  index: number; question: string; answer: string; open: boolean; onToggle: () => void;
}) {
  return (
    <div className="border-b border-line">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-4 py-5 text-left group cursor-pointer"
      >
        <span className={`font-mono text-[11px] flex-none transition-colors ${open ? 'text-accent-hi font-bold' : 'text-faint'}`}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className={`text-[15px] font-medium flex-1 transition-colors ${open ? 'text-ink' : 'text-slate-200 group-hover:text-white'}`}>
          {question}
        </span>
        <span className={`w-7 h-7 rounded-md border flex items-center justify-center flex-none transition-all duration-300 ${
          open
            ? 'border-accent/40 bg-accent/10 text-accent-hi rotate-180'
            : 'border-line text-faint group-hover:text-muted group-hover:border-line-strong'
        }`}>
          <IconChevronDown />
        </span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="pb-5 pl-9 pr-10 text-[13px] leading-relaxed text-muted">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   DATI STATICI
   ========================================================================== */

const NAV_LINKS = [
  { href: '#demo', label: 'Demo' },
  { href: '#funzioni', label: 'Funzioni' },
  { href: '#come-funziona', label: 'Come funziona' },
  { href: '#faq', label: 'FAQ' }
];

const TICKER_ITEMS = [
  { text: 'LEAD #4821 QUALIFICATO — MILANO', tone: 'mint' },
  { text: 'STIMA COMPLETATA — € 41.250 / ANNO', tone: 'accent' },
  { text: 'WEBHOOK CONSEGNATO → MAKE.COM', tone: 'cyan' },
  { text: 'NUOVO TERMINALE PUBBLICATO — LISTINO V3', tone: 'mint' },
  { text: 'EXPORT CSV — 128 RIGHE TRASFERITE', tone: 'accent' },
  { text: 'LEAD #4822 QUALIFICATO — TORINO', tone: 'mint' },
  { text: 'STIMA COMPLETATA — € 12.890 / ANNO', tone: 'accent' },
  { text: 'WEBHOOK CONSEGNATO → N8N', tone: 'cyan' }
];

const STEPS = [
  {
    n: '01',
    icon: IconSliders,
    title: 'Configura parametri e formule',
    body: 'Definisci slider, campi numerici e menu a tendina. Scrivi le formule con operatori condizionali, funzioni min/max e valori nidificati. Nessun codice richiesto.'
  },
  {
    n: '02',
    icon: IconCode,
    title: 'Incorpora con un rigo',
    body: 'Incolla lo snippet iframe nella tua pagina. Lo script di auto-ridimensionamento via postMessage mantiene il widget perfetto su ogni device.'
  },
  {
    n: '03',
    icon: IconInbox,
    title: 'Ricevi lead qualificati',
    body: 'Ogni calcolo completato arriva nel tuo registro con contatto, parametri scelti e risultato: un intento d’acquisto documentato, non un modulo vuoto.'
  }
];

const FEATURES = [
  {
    n: '01',
    icon: IconBolt,
    tag: 'ENGINE',
    title: 'Motore formule deterministico',
    body: 'Espressioni matematiche complesse valutate lato client a ogni interazione. Operatori ternari, funzioni min/max, precedenza corretta: zero latenza, zero round-trip.'
  },
  {
    n: '02',
    icon: IconWebhook,
    tag: 'WEBHOOK',
    title: 'Lead gate & automazioni',
    body: 'Prima del risultato, il contatto viene acquisito e inoltrato con l’intero stato del calcolo a Supabase, Make, Zapier, n8n o al tuo endpoint dedicato.'
  },
  {
    n: '03',
    icon: IconCode,
    tag: 'EMBED',
    title: 'Incorporamento in un rigo',
    body: 'Snippet iframe con auto-resize postMessage. Nessuna scrollbar, nessun conflitto di stile, nessuna manutenzione sul tuo dominio.'
  },
  {
    n: '04',
    icon: IconActivity,
    tag: 'LIVE',
    title: 'Telemetria in tempo reale',
    body: 'I risultati vengono ricalcolati istantaneamente e narrati con tween numerici. Ogni lead registra lo stato esatto del calcolo al momento dell’invio.'
  },
  {
    n: '05',
    icon: IconShield,
    tag: 'SECURITY',
    title: 'Sicurezza a livello di riga',
    body: 'Dati protetti da Row Level Security su Postgres. Ogni lead appartiene esclusivamente al terminale e all’account che l’ha generato.'
  },
  {
    n: '06',
    icon: IconSliders,
    tag: 'BRAND',
    title: 'White-label per colore',
    body: 'Un parametro, un hex: il widget eredita il colore del tuo brand su slider, valori e call-to-action. Il resto dell’interfaccia resta istituzionale.'
  }
];

const COMPARISON = [
  { label: 'Conversione media del modulo', calc: '38,4%', form: '2-4%' },
  { label: 'Dati raccolti per contatto', calc: 'Contatto + intento + valori', form: 'Solo contatto' },
  { label: 'Esperienza utente', calc: 'Interattiva, in tempo reale', form: 'Campi statici' },
  { label: 'Arrivo nel CRM', calc: 'Automatico via webhook', form: 'Export manuale' },
  { label: 'Tempo di implementazione', calc: '< 60 secondi', form: 'Settimane di sviluppo' }
];

const FAQS = [
  {
    q: 'Che formato hanno le formule di calcolo?',
    a: 'Espressioni matematiche standard con +, -, *, /, parentesi e operatori ternari condizionali (es. clienti > 100 ? tariffaA : tariffaB). Sono supportate le funzioni min() e max() e il riferimento a qualsiasi variabile di input tramite il suo nome.'
  },
  {
    q: 'Come ricevo concretamente i lead?',
    a: 'Ogni lead viene salvato nel tuo registro su Supabase e, se configurato, inoltrato in tempo reale via webhook a Make, Zapier, n8n o a un endpoint tuo. Il payload include contatto, valori degli input e risultati calcolati. Puoi sempre esportare tutto in CSV.'
  },
  {
    q: 'Posso personalizzare colori e testi del widget?',
    a: 'Sì. Il colore primario è un parametro (in formato hex) che tinge slider, chip dei valori e pulsante di sblocco. Puoi configurare il testo della privacy, l’URL della policy e l’azione post-invio: sblocco dei risultati o redirect a una pagina tua.'
  },
  {
    q: 'Funziona correttamente su mobile?',
    a: 'Sì. Il widget è responsive e comunica la propria altezza alla pagina ospite tramite postMessage, ridimensionando l’iframe automaticamente. Nessuna scrollbar orizzontale, nessun taglio dei contenuti su smartphone.'
  },
  {
    q: 'Quanto costa iniziare?',
    a: 'Il piano gratuito include la creazione e pubblicazione dei tuoi primi calcolatori con lead gate attivo. Quando i volumi crescono, il piano Pro sblocca limiti superiori, webhook prioritari e opzioni di white-label avanzate.'
  }
];

const SNIPPET = `<!-- CalcFlow · Preventivo interattivo -->
<iframe
  src="https://app.calcflow.io/embed/IL_TUO_ID"
  style="width:100%;height:640px;border:0"
  loading="lazy"
  title="Preventivo dal vivo">
</iframe>`;

const SWATCHES = [
  { label: 'Istituzionale', value: '#4D7CFE' },
  { label: 'Ciano', value: '#4CC9FF' },
  { label: 'Menta', value: '#2CE0A5' },
  { label: 'Viola', value: '#8B7CFF' },
  { label: 'Ambra', value: '#FFB224' }
];

/* ==========================================================================
   HEADER CENTRATO & AD ALTA VISIBILITÀ
   ========================================================================== */

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="relative bg-void/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-[68px] flex items-center justify-between relative">
          
          {/* Logo SX con Sigma-Flow */}
          <Link href="/" className="flex items-center gap-3 z-10" onClick={() => setOpen(false)}>
            <Mark size={28} />
            <span className="font-mono text-[16px] sm:text-[18px] font-bold tracking-[0.1em] text-white">
              CALCFLOW
            </span>
            <span className="hidden xl:inline chip !py-0.5 !px-2 !text-[9px] border-line-strong text-slate-400">
              v2.6
            </span>
          </Link>

          {/* Voci di navigazione matematicamente centrate e ingrandite */}
          <nav
            className="hidden md:flex items-center gap-8 lg:gap-10 absolute left-1/2 -translate-x-1/2 z-10"
            aria-label="Navigazione principale"
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-mono text-[13px] lg:text-[14px] font-semibold tracking-[0.14em] uppercase text-slate-300 hover:text-white transition-colors duration-150 py-1 hover:drop-shadow-[0_0_8px_rgba(77,124,254,0.6)]"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Azioni DX */}
          <div className="hidden md:flex items-center gap-3.5 z-10">
            <span className="hidden lg:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 mr-2">
              <span className="dot-live" />
              SYSTEMS OPERATIONAL
            </span>
            <Link href="/login" className="btn btn-ghost btn-sm !text-slate-200 hover:!text-white !text-[12px]">
              Accedi
            </Link>
            <Link href="/login?mode=signup" className="btn btn-primary btn-sm !text-[12px] !shadow-[0_0_20px_rgba(77,124,254,0.4)]">
              Inizia gratis
              <IconArrowUpRight />
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            className="md:hidden btn-icon z-10"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Chiudi menu' : 'Apri menu'}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>

        <ScrollProgress />
      </div>

      {/* Menu mobile a comparsa */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 bg-void/95 backdrop-blur-xl border-b border-line ${
        open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <nav className="px-6 py-5 flex flex-col gap-2" aria-label="Navigazione mobile">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 font-mono text-[14px] font-semibold uppercase tracking-[0.14em] text-slate-200 hover:text-white transition-colors border-b border-line/50 last:border-0"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3">
            <Link href="/login" className="btn btn-ghost btn-sm flex-1 !text-[13px]" onClick={() => setOpen(false)}>
              Accedi
            </Link>
            <Link href="/login?mode=signup" className="btn btn-primary btn-sm flex-1 !text-[13px]" onClick={() => setOpen(false)}>
              Inizia gratis
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

/* ==========================================================================
   SEZIONI PAGINA
   ========================================================================== */

function Hero() {
  return (
    <section className="relative overflow-hidden pt-[68px]">
      <div className="absolute inset-0 glow-hero pointer-events-none" />
      <div className="absolute inset-0 bg-grid grid-fade pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <HeroCanvas />
      </div>
      <div className="scan-line" aria-hidden="true" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 pt-24 pb-28 sm:pt-32 sm:pb-36 text-center">
        <div className="anim-fade-up inline-flex items-center gap-2.5 chip !bg-surface/80 backdrop-blur">
          <span className="dot-live" />
          Enterprise calculation engine &amp; lead intelligence
        </div>

        <h1 className="anim-fade-up mt-8 text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-[4.7rem] font-extrabold tracking-[-0.03em] uppercase"
          style={{ animationDelay: '80ms' }}>
          Preventivi dal vivo.
          <span className="block bg-gradient-to-r from-accent-hi via-cyan to-mint bg-clip-text text-transparent glow-text pb-2">
            Lead già qualificati.
          </span>
        </h1>

        <p className="anim-fade-up mt-6 max-w-2xl mx-auto text-[15px] sm:text-base leading-relaxed text-muted"
          style={{ animationDelay: '160ms' }}>
          CalcFlow sostituisce il modulo di contatto statico con un terminale di
          stima interattivo: il cliente muove i cursori, vede il risultato
          formarsi in tempo reale e lascia il contatto per la versione completa.
        </p>

        <div className="anim-fade-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          style={{ animationDelay: '240ms' }}>
          <Link href="/login?mode=signup" className="btn btn-primary w-full sm:w-auto !px-8 !py-4">
            Inizia ora — piano free
            <IconArrowUpRight />
          </Link>
          <a href="#demo" className="btn btn-ghost w-full sm:w-auto !px-8 !py-4">
            Prova la demo live
          </a>
        </div>

        <div className="anim-fade-up mt-12 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2"
          style={{ animationDelay: '320ms' }}>
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint mr-2">
            Integrazioni native
          </span>
          {['Supabase', 'Make', 'Zapier', 'n8n', 'Webhook'].map((name) => (
            <span key={name} className="chip">{name}</span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 scroll-hint">
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-faint">Scroll</span>
        <span className="block w-px h-8 bg-gradient-to-b from-accent/60 to-transparent" />
      </div>
    </section>
  );
}

function Ticker() {
  return (
    <div className="ticker relative border-y border-line bg-surface/60 overflow-hidden" aria-hidden="true">
      <div className="ticker-track py-2.5">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="flex-none flex items-center gap-3 px-7 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em]">
            <span className={`w-1 h-1 rounded-full flex-none ${
              item.tone === 'mint' ? 'bg-mint' : item.tone === 'cyan' ? 'bg-cyan' : 'bg-accent'
            }`} />
            <span className="text-muted">{item.text}</span>
          </span>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-void to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-void to-transparent pointer-events-none" />
    </div>
  );
}

function DemoSection() {
  const [accent, setAccent] = useState('#4D7CFE');

  const sampleInputs = useMemo(() => [
    { id: '1', variable: 'volume', type: 'slider' as const, label: 'Transazioni / mese', defaultValue: 1250, min: 100, max: 10000, step: 50 },
    { id: '2', variable: 'ticket', type: 'number' as const, label: 'Ticket medio', defaultValue: 140, min: 10, max: 2000, step: 5, prefix: '€' },
    {
      id: '3', variable: 'segment', type: 'select' as const, label: 'Segmento di mercato',
      defaultValue: 1, min: 0, max: 10, step: 0.05,
      options: [
        { label: 'PME — listino standard', value: 1 },
        { label: 'Enterprise — sconto volume', value: 0.85 },
        { label: 'Nicchia — premium', value: 1.25 }
      ]
    }
  ], []);

  const sampleOutputs = useMemo(() => [
    { id: '1', variable: 'gross', label: 'Valore annualizzato', formula: 'volume * ticket * segment * 12', prefix: '€', highlight: true },
    { id: '2', variable: 'monthly', label: 'Valore mensile', formula: 'volume * ticket * segment', prefix: '€' }
  ], []);

  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section id="demo" className="relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24">
        <div ref={ref} className={`reveal ${visible ? 'reveal-in' : ''} grid lg:grid-cols-12 gap-12 lg:gap-16 items-start`}>
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="section-label">01 — Dimostrazione dal vivo</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-[1.1]">
                Muovi i cursori.
                <span className="block text-accent-hi">Il calcolo risponde.</span>
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                Questo è il modulo reale, non uno screenshot. Ogni modifica
                ricalcola la stima all’istante. Nella versione pubblicata, il
                risultato analitico si sblocca solo dopo l’acquisizione del
                contatto — con l’intero stato del calcolo allegato al lead.
              </p>
            </div>

            <ul className="space-y-3 font-mono text-[11px]">
              {[
                'Ricalcolo lato client — 0ms di attesa',
                'Stato completo allegato a ogni lead',
                'Lead gate configurabile per terminale',
                'Auto-resize iframe via postMessage'
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-muted">
                  <span className="w-4 h-4 rounded border border-mint/30 bg-mint/10 text-mint flex items-center justify-center flex-none">
                    <IconCheck size={9} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="panel-flat p-4 space-y-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint">
                Personalizza il colore — tocca uno swatch
              </span>
              <div className="flex items-center gap-2.5">
                {SWATCHES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setAccent(s.value)}
                    title={s.label}
                    aria-label={`Colore ${s.label}`}
                    aria-pressed={accent === s.value}
                    className={`w-8 h-8 rounded-lg border transition-all duration-200 cursor-pointer ${
                      accent === s.value
                        ? 'scale-110 border-white/50 shadow-[0_0_16px_rgba(255,255,255,0.15)]'
                        : 'border-line hover:scale-105 hover:border-line-strong'
                    }`}
                    style={{ backgroundColor: s.value }}
                  />
                ))}
                <span className="ml-2 font-mono text-[10px] text-faint tabular">
                  {accent.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 relative">
            <div className="absolute -top-4 right-6 z-20 chip !border-accent/40 !bg-surface !text-accent-hi">
              Esempio live
            </div>
            <div className="absolute -inset-6 bg-accent/[0.07] blur-3xl rounded-full pointer-events-none" aria-hidden="true" />
            <div className="relative rounded-2xl border border-line-strong/50 bg-surface/40 p-3 sm:p-5 backdrop-blur-sm">
              <CalculatorPreview
                inputs={sampleInputs}
                outputs={sampleOutputs}
                primaryColor={accent}
                enableLeadGate={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricsBand() {
  const metrics = [
    { value: 38.4, decimals: 1, prefix: '+', suffix: '%', label: 'Conversione media vs form statico' },
    { value: 60, decimals: 0, prefix: '< ', suffix: ' sec', label: 'Dalla configurazione al deploy' },
    { value: 1, decimals: 0, prefix: '', suffix: ' rigo', label: 'Di codice per incorporare' },
    { value: 99.99, decimals: 2, prefix: '', suffix: '%', label: 'Uptime del motore di calcolo' }
  ];

  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section className="relative border-y border-line bg-surface/40">
      <div ref={ref} className={`reveal ${visible ? 'reveal-in' : ''} max-w-7xl mx-auto px-5 lg:px-8`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-line">
          {metrics.map((m) => (
            <div key={m.label} className="px-6 py-10 text-center lg:text-left">
              <div className="font-mono text-3xl lg:text-[2.6rem] font-bold text-ink leading-none">
                <Stat
                  value={m.value}
                  decimals={m.decimals}
                  prefix={m.prefix}
                  suffix={m.suffix}
                  className="bg-gradient-to-r from-ink to-accent-hi bg-clip-text text-transparent"
                />
              </div>
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-faint leading-relaxed">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepsSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section id="come-funziona" className="scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24">
        <div ref={ref} className={`reveal ${visible ? 'reveal-in' : ''}`}>
          <div className="text-center space-y-4 mb-14">
            <span className="section-label justify-center">02 — Protocollo operativo</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Dal parametro al lead in tre mosse
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-[52px] left-[16%] right-[16%] border-t border-dashed border-line-strong" aria-hidden="true" />

            {STEPS.map((s) => (
              <div key={s.n} className="panel panel-hover relative p-7 text-center space-y-4">
                <div className="relative inline-flex">
                  <div className="w-[72px] h-[72px] rounded-2xl border border-accent/25 bg-accent/[0.08] text-accent-hi flex items-center justify-center">
                    <s.icon size={26} />
                  </div>
                  <span className="absolute -top-2 -right-2 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-void border border-line-strong text-muted tabular">
                    {s.n}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-ink">{s.title}</h3>
                <p className="text-[13px] leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section id="funzioni" className="scroll-mt-20 border-t border-line bg-surface/30">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24">
        <div ref={ref} className={`reveal ${visible ? 'reveal-in' : ''}`}>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <span className="section-label">03 — Specifiche di sistema</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink max-w-xl leading-[1.1]">
                Ingegnerizzato come uno strumento di precisione
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              6 moduli · 0 dipendenze superflue
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <TiltCard key={f.n}>
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl border border-accent/25 bg-accent/[0.08] text-accent-hi flex items-center justify-center">
                    <f.icon size={20} />
                  </div>
                  <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-faint border border-line rounded px-1.5 py-0.5">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-ink mb-2">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-muted">{f.body}</p>
                <span className="absolute top-4 right-4 font-mono text-[9px] text-faint/60 tabular">
                  {f.n}
                </span>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmbedSection() {
  const [copied, setCopied] = useState(false);
  const { ref, visible } = useReveal<HTMLDivElement>();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = SNIPPET;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section className="border-t border-line">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24">
        <div ref={ref} className={`reveal ${visible ? 'reveal-in' : ''} grid lg:grid-cols-2 gap-12 items-center`}>
          <div className="space-y-5">
            <span className="section-label">04 — Deploy</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-[1.1]">
              Un rigo di codice.
              <span className="block text-faint font-normal text-2xl sm:text-3xl mt-2">Zero manutenzione.</span>
            </h2>
            <p className="text-sm leading-relaxed text-muted max-w-md">
              Copia lo snippet, incollalo dove vuoi che appaia il preventivo.
              Lo script di auto-ridimensionamento tiene l’iframe perfetto su
              ogni viewport, senza righe extra di CSS o JavaScript.
            </p>
            <ul className="space-y-2.5 font-mono text-[11px] text-muted">
              {['Nessun conflitto di stile con il tuo dominio', 'Altezza sincronizzata in tempo reale', 'Lazy-loading nativo dell’iframe'].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded border border-accent/30 bg-accent/10 text-accent-hi flex items-center justify-center flex-none">
                    <IconCheck size={9} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="code-block overflow-hidden">
            <div className="flex items-center justify-between px-4 h-10 border-b border-line bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-mint/60" />
                <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
                  embed.html
                </span>
              </div>
              <button
                onClick={copy}
                className={`btn btn-sm ${copied ? 'btn-soft' : 'btn-ghost'}`}
                aria-live="polite"
              >
                {copied ? (
                  <><IconCheck size={10} /> Copiato</>
                ) : (
                  <><IconCopy /> Copia</>
                )}
              </button>
            </div>
            <pre className="p-5 overflow-x-auto text-[12px] leading-relaxed">
              <code className="text-muted">{SNIPPET}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section className="border-t border-line bg-surface/30">
      <div className="max-w-5xl mx-auto px-5 lg:px-8 py-24">
        <div ref={ref} className={`reveal ${visible ? 'reveal-in' : ''}`}>
          <div className="text-center space-y-4 mb-12">
            <span className="section-label justify-center">05 — Confronto</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Perché non un form di contatto statico
            </h2>
          </div>

          <div className="panel overflow-hidden">
            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_1fr] font-mono text-[9px] uppercase tracking-[0.2em] text-faint border-b border-line bg-white/[0.02]">
              <span className="px-5 py-3.5">Metrica</span>
              <span className="px-5 py-3.5 text-accent-hi text-center">CalcFlow</span>
              <span className="px-5 py-3.5 text-right sm:text-center hidden sm:block">Form statico</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_1fr] items-center gap-3 px-5 py-4 text-[13px] hover:bg-white/[0.02] transition-colors ${
                  i < COMPARISON.length - 1 ? 'border-b border-line' : ''
                }`}
              >
                <span className="text-muted">{row.label}</span>
                <span className="flex items-center gap-2 text-ink font-medium text-right sm:text-left justify-end sm:justify-start">
                  <span className="w-4 h-4 rounded-full bg-mint/15 border border-mint/40 text-mint flex items-center justify-center flex-none">
                    <IconCheck size={9} />
                  </span>
                  {row.calc}
                </span>
                <span className="hidden sm:flex items-center gap-2 text-faint justify-start pl-4">
                  <span className="w-4 h-4 rounded-full bg-rose/10 border border-rose/30 text-rose/70 flex items-center justify-center flex-none">
                    <IconX size={9} />
                  </span>
                  {row.form}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section id="faq" className="scroll-mt-20 border-t border-line">
      <div className="max-w-3xl mx-auto px-5 lg:px-8 py-24">
        <div ref={ref} className={`reveal ${visible ? 'reveal-in' : ''}`}>
          <div className="text-center space-y-4 mb-10">
            <span className="section-label justify-center">06 — Domande frequenti</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Specifiche, chiarite
            </h2>
          </div>

          <div className="border-t border-line">
            {FAQS.map((f, i) => (
              <FaqItem
                key={f.q}
                index={i}
                question={f.q}
                answer={f.a}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section className="border-t border-line bg-surface/30">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24">
        <div ref={ref} className={`reveal ${visible ? 'reveal-in' : ''} relative panel overflow-hidden text-center px-6 py-16 sm:py-20`}>
          <div className="edge-light" />
          <div className="absolute inset-0 bg-grid grid-fade opacity-60 pointer-events-none" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[240px] bg-accent/15 blur-[90px] rounded-full pointer-events-none" />

          <div className="relative space-y-6">
            <span className="chip mx-auto">
              <span className="dot-live" />
              Inizio rapido — nessuna carta richiesta
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink">
              Apri il tuo primo terminale.
            </h2>
            <p className="max-w-md mx-auto text-sm leading-relaxed text-muted">
              Crea il calcolatore, incorpora lo snippet e ricevi il primo lead
              qualificato. Tutta l’operazione richiede meno di un caffè.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link href="/login?mode=signup" className="btn btn-primary w-full sm:w-auto !px-8 !py-4">
                Crea il primo calcolatore
                <IconArrowUpRight />
              </Link>
              <Link href="/dashboard" className="btn btn-ghost w-full sm:w-auto !px-8 !py-4">
                Consulta la dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2 space-y-4 max-w-sm">
            <div className="flex items-center gap-3">
              <Mark size={26} />
              <span className="font-mono text-[16px] font-bold tracking-[0.08em] text-white">
                CALCFLOW
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-muted">
              Terminale di stima interattiva e acquisizione lead per aziende
              che prendono sul serio i propri numeri. Formule deterministiche,
              webhook nativi, deploy in un rigo.
            </p>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              <span className="dot-live" />
              All systems operational
            </div>
          </div>

          <div>
            <h4 className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint mb-4">Indice</h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-[13px] text-muted hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint mb-4">Accesso</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/login" className="text-[13px] text-muted hover:text-white transition-colors">
                  Accedi al terminale
                </Link>
              </li>
              <li>
                <Link href="/login?mode=signup" className="text-[13px] text-muted hover:text-white transition-colors">
                  Crea un account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-[13px] text-muted hover:text-white transition-colors">
                  Dashboard lead
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-5 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
          <span>© 2026 CalcFlow Protocol — Tutti i diritti riservati</span>
          <span className="flex items-center gap-2">
            Engine v2.6
            <span className="w-1 h-1 rounded-full bg-faint" />
            Postgres · RLS Active
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ==========================================================================
   ENTRYPOINT PAGINA
   ========================================================================== */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void text-ink antialiased selection:bg-accent/30">
      <Header />
      <main>
        <Hero />
        <Ticker />
        <DemoSection />
        <MetricsBand />
        <StepsSection />
        <FeaturesSection />
        <EmbedSection />
        <ComparisonSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}