'use client';

import React from 'react';
import Link from 'next/link';
import CyberCanvas3D from '@/components/CyberCanvas3D';
import CalculatorPreview from '@/components/CalculatorPreview';

export default function LandingPage() {
  const sampleInputs = [
    { id: '1', variable: 'volume', type: 'slider' as const, label: 'Transazioni / Mese', defaultValue: 1250, min: 100, max: 10000, step: 50 },
    { id: '2', variable: 'ticket', type: 'number' as const, label: 'Ticket Medio Valutato', defaultValue: 140, min: 10, max: 2000, step: 5, prefix: '€' }
  ];

  const sampleOutputs = [
    { id: '1', variable: 'gross', label: 'Volume Annualizzato Stimato', formula: 'volume * ticket * 12', prefix: '€', highlight: true }
  ];

  return (
    <div className="relative min-h-screen bg-[#06080D] text-slate-100 bg-tech-grid overflow-x-hidden selection:bg-[#00F0FF] selection:text-[#06080D]">
      {/* Sfondo 3D WebGL Interattivo */}
      <CyberCanvas3D />

      {/* Bagliore Radiale Superiore */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-radial-hero pointer-events-none z-0" />

      {/* Header / Telemetria Arkham-Style */}
      <nav className="relative z-10 border-b border-white/5 backdrop-blur-md bg-[#06080D]/75">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono text-base font-black tracking-widest text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]"></span>
              CALCFLOW<span className="text-[#00F0FF]">_INTELLIGENCE</span>
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-[#101623] text-slate-400 border border-white/10">
              CORE v2.6 // LATENCY: 14ms
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-mono text-slate-400 hover:text-white transition tracking-wide"
            >
              TERMINAL LOGIN
            </Link>
            <Link
              href="/login"
              className="text-xs font-mono font-bold px-4 py-2 rounded-lg bg-[#00F0FF] hover:bg-[#00D8E6] text-[#06080D] transition tracking-wider uppercase shadow-[0_0_20px_rgba(0,240,255,0.25)]"
            >
              LAUNCH APP ↗
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#101623] border border-white/10 text-[11px] font-mono text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F59B] animate-ping"></span>
          <span>ENTERPRISE CALCULATION ENGINE &amp; LEAD INTELLIGENCE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-none uppercase">
          The Precision Engine for <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00F0FF] via-[#00F59B] to-white glow-cyan">
            Pricing &amp; Lead Calculations
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-sans font-normal">
          Sostituisci i moduli di contatto statici con terminali interattivi ad alta conversione. Raccogli lead qualificati offrendo calcoli finanziari e preventivi in tempo reale.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00F0FF] hover:bg-[#00D8E6] text-[#06080D] text-xs font-mono font-black tracking-wider uppercase transition shadow-[0_0_30px_rgba(0,240,255,0.3)]"
          >
            INIZIA ORA — PIANO FREE
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0B0F17] hover:bg-[#121824] text-slate-200 border border-white/10 text-xs font-mono font-semibold tracking-wider uppercase transition"
          >
            CONSULTA DASHBOARD ↗
          </Link>
        </div>
      </section>

      {/* Terminal Preview Bento Showcase */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-[#00F0FF] tracking-widest uppercase block">
                // ARCHITETTURA DIRETTA
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                Dal calcolo istantaneo al lead qualificato nel tuo CRM
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gli utenti compilano i parametri visivi. Prima di sbloccare i risultati finali, CalcFlow acquisisce i dati di contatto e li inoltra istantaneamente a Supabase, Zapier, Make o al tuo webhook dedicato.
              </p>
            </div>

            {/* Metriche Bento */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-4 rounded-xl terminal-panel border border-white/10">
                <span className="text-[10px] text-slate-500 uppercase block">CONVERSIONE MEDIA</span>
                <span className="text-2xl font-black text-[#00F59B] font-tabular">+38.4%</span>
              </div>
              <div className="p-4 rounded-xl terminal-panel border border-white/10">
                <span className="text-[10px] text-slate-500 uppercase block">TEMPO DI DEPLOY</span>
                <span className="text-2xl font-black text-[#00F0FF] font-tabular">&lt; 60 SEC</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-linear-to-r from-[#00F0FF]/20 to-[#00F59B]/20 rounded-3xl blur-xl opacity-50"></div>
              <div className="relative">
                <CalculatorPreview
                  inputs={sampleInputs}
                  outputs={sampleOutputs}
                  primaryColor="#00F0FF"
                  enableLeadGate={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Arkham-Style */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-mono text-[#00F0FF] tracking-widest uppercase">
            // SPECIFICHE SISTEMA
          </span>
          <h3 className="text-2xl sm:text-3xl font-black uppercase">
            Ingegnerizzato per la Massima Precisione
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="terminal-panel terminal-panel-hover p-6 rounded-2xl space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 flex items-center justify-center font-mono text-sm">
              01
            </div>
            <h4 className="text-sm font-bold font-mono uppercase text-slate-200">Motore Formule Dinamiche</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Supporto a espressioni matematiche complesse, operatori ternari condizionali (`clienti &gt; 100 ? a : b`) e funzioni min/max.
            </p>
          </div>

          <div className="terminal-panel terminal-panel-hover p-6 rounded-2xl space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#00F59B]/10 text-[#00F59B] border border-[#00F59B]/20 flex items-center justify-center font-mono text-sm">
              02
            </div>
            <h4 className="text-sm font-bold font-mono uppercase text-slate-200">Lead Gate &amp; Webhooks</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrazione webhook diretta per Make, Zapier e n8n. Spedizione immediata del payload con input e risultati calcolati.
            </p>
          </div>

          <div className="terminal-panel terminal-panel-hover p-6 rounded-2xl space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 flex items-center justify-center font-mono text-sm">
              03
            </div>
            <h4 className="text-sm font-bold font-mono uppercase text-slate-200">Micro-iFrame Responsive</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Snippet di embed a 1 riga con script di auto-ridimensionamento postMessage. Nessuna barra di scorrimento orizzontale o verticale.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Tecnico */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>CALCFLOW PROTOCOL © 2026 // ALL RIGHTS RESERVED</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>UPTIME: 99.99%</span>
            <span>POSTGRES: RLS ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}