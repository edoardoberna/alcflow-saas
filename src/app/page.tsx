import Link from 'next/link';
import CalculatorPreview from '@/components/CalculatorPreview';

/* ——— Marchio tipografico: quadrato di protocollo con diagonale ——— */
function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="text-forest" aria-hidden="true">
      <rect x="1.5" y="1.5" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 13.5 13.5 4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.5" cy="5.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 10 10 2M3.8 2H10v6.2" />
    </svg>
  );
}

const tickerItems = [
  'Pratica n. 0841 — stima completata — € 41.250',
  'Webhook consegnato — Make.com',
  'Nuovo lead verificato — Milano',
  'Calcolatore pubblicato — Listino v3',
  'Export CSV completato — 128 righe',
  'Nuovo lead verificato — Torino',
  'Pratica n. 0842 — stima completata — € 12.890',
  'Webhook consegnato — n8n'
];

const steps = [
  { n: '01', title: 'Configuri parametri e formule', meta: '≈ 5 min' },
  { n: '02', title: 'Incorpori il modulo nel sito', meta: '1 rigo' },
  { n: '03', title: 'Raccoglie lead già qualificati', meta: 'automatico' }
];

const features = [
  {
    n: '01',
    title: 'Motore di calcolo deterministico',
    tag: 'formule',
    body: 'Espressioni matematiche complesse, operatori condizionali e funzioni min/max. Ogni valore viene ricalcolato lato client a ogni interazione: nessuna attesa, nessun round-trip verso il server.'
  },
  {
    n: '02',
    title: 'Acquisizione lead integrata',
    tag: 'webhook',
    body: 'Prima di svelare il risultato, il modulo acquisisce il contatto e lo inoltra a Supabase, Make, Zapier, n8n o al webhook dedicato, completo dell’intero stato del calcolo.'
  },
  {
    n: '03',
    title: 'Incorporamento in un rigo',
    tag: 'iframe',
    body: 'Snippet iframe con auto-ridimensionamento via postMessage: nessuna barra di scorrimento, nessun conflitto di stile con il tuo dominio, nessuna manutenzione.'
  }
];

export default function LandingPage() {
  const sampleInputs = [
    { id: '1', variable: 'volume', type: 'slider' as const, label: 'Transazioni mensili', defaultValue: 1250, min: 100, max: 10000, step: 50 },
    { id: '2', variable: 'ticket', type: 'number' as const, label: 'Valore medio del cliente', defaultValue: 140, min: 10, max: 2000, step: 5, prefix: '€' },
    {
      id: '3', variable: 'segment', type: 'select' as const, label: 'Segmento di mercato',
      defaultValue: 1, min: 0, max: 10, step: 0.05,
      options: [
        { label: 'PME — listino standard', value: 1 },
        { label: 'Enterprise — sconto volume', value: 0.85 },
        { label: 'Nicchia — posizione premium', value: 1.25 }
      ]
    }
  ];

  const sampleOutputs = [
    { id: '1', variable: 'gross', label: 'Valore annualizzato stimato', formula: 'volume * ticket * segment * 12', prefix: '€', highlight: true },
    { id: '2', variable: 'monthly', label: 'Valore mensile stimato', formula: 'volume * ticket * segment', prefix: '€' }
  ];

  return (
    <div className="min-h-screen text-ink overflow-x-hidden selection:bg-forest selection:text-paper-raised">

      {/* ——— Testata ——— */}
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-sm border-b border-hairline">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2.5">
              <Mark />
              <span className="font-serif text-lg font-semibold tracking-tight">CalcFlow</span>
            </Link>
            <span className="hidden md:inline border-l border-hairline-strong pl-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              Motore di stima commerciale
            </span>
          </div>

          <nav className="flex items-center gap-5">
            <a href="#demo" className="nav-link hidden sm:inline">Dimostrazione</a>
            <a href="#funzioni" className="nav-link hidden sm:inline">Funzioni</a>
            <span className="hidden sm:block w-px h-4 bg-hairline-strong" />
            <Link href="/login" className="nav-link">Accedi</Link>
            <Link href="/login" className="btn btn-forest btn-sm">Inizia gratis</Link>
          </nav>
        </div>
      </header>

      {/* ——— Banda telemetria (telescrivente) ——— */}
      <div className="ticker bg-ink text-paper/75 overflow-hidden border-b border-ink">
        <div className="ticker-track py-2.5">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="flex-none flex items-center gap-3 px-6 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em]">
              <span className="w-1 h-1 rounded-full bg-paper/40" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ——— Hero Section ——— */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <span className="hidden xl:block absolute left-0 top-28 [writing-mode:vertical-rl] rotate-180 font-mono text-[9px] tracking-[0.3em] uppercase text-ink-faint">
          Doc. CF—2026/001 · Protocollato
        </span>
        <span className="hidden xl:block absolute right-0 top-28 [writing-mode:vertical-rl] font-mono text-[9px] tracking-[0.3em] uppercase text-ink-faint">
          Precisione al centesimo
        </span>

        <div className="inline-flex items-center gap-2.5 border border-hairline bg-paper-raised px-3.5 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Motore di stima e acquisizione lead — v2.6
          </span>
        </div>

        <h1 className="display mt-8 text-4xl sm:text-6xl lg:text-[4.6rem] leading-[1.05] text-ink max-w-4xl mx-auto">
          Il preventivo è la tua
          <em className="block italic font-light text-forest">prima stretta di mano.</em>
        </h1>

        <p className="mt-7 max-w-2xl mx-auto text-ink-soft leading-relaxed">
          CalcFlow trasforma il modulo di contatto in uno strumento di stima dal vivo:
          il cliente muove i cursori, vede il risultato formarsi in tempo reale e lascia
          il contatto per la versione completa. Ogni lead arriva già qualificato.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login" className="btn btn-forest w-full sm:w-auto">
            Crea il tuo calcolatore <ArrowIcon />
          </Link>
          <a href="#demo" className="btn btn-ghost w-full sm:w-auto">Guarda la dimostrazione</a>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
          <span>Nessuna carta richiesta</span>
          <span className="w-1 h-1 rounded-full bg-ink-faint/60" />
          <span>Pubblicazione in un rigo</span>
          <span className="w-1 h-1 rounded-full bg-ink-faint/60" />
          <span>Esportazione verso qualsiasi CRM</span>
        </div>
      </section>

      {/* ——— Dimostrazione dal vivo ——— */}
      <section id="demo" className="scroll-mt-20 border-t border-hairline">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-forest">
              01 — Dimostrazione dal vivo
            </span>
            <h2 className="display mt-4 text-3xl sm:text-4xl leading-tight text-ink">
              Muovi i cursori.
              <span className="block italic font-light text-forest">Il calcolo risponde.</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-ink-soft">
              Questo è il modulo reale, non un’immagine. Ogni modifica ricalcola la stima
              all’istante. Nella versione pubblicata, il risultato analitico si svela solo
              dopo l’acquisizione del contatto — con l’intero stato del calcolo allegato.
            </p>

            <ol className="mt-10 border-t border-hairline">
              {steps.map((s) => (
                <li key={s.n} className="flex items-baseline gap-4 py-4 border-b border-hairline">
                  <span className="font-mono text-[10px] text-forest flex-none">{s.n}</span>
                  <span className="text-sm font-medium text-ink">{s.title}</span>
                  <span className="leader" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-faint flex-none">
                    {s.meta}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-7 relative">
            <span className="stamp absolute -top-3 right-6 z-10 rotate-2 bg-paper-raised text-seal">
              Esempio live
            </span>
            <div className="border border-hairline-strong/40 bg-paper-raised p-3 sm:p-5 shadow-[10px_10px_0_0_rgba(31,29,24,0.07)]">
              <CalculatorPreview
                inputs={sampleInputs}
                outputs={sampleOutputs}
                primaryColor="#1E4D3B"
                enableLeadGate={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ——— Banda di cifre ——— */}
      <section className="bg-forest-deep text-paper">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid sm:grid-cols-3 gap-y-10 sm:divide-x sm:divide-paper/15">
            <div className="sm:pr-10">
              <div className="display text-5xl">+38,4%</div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/70 leading-relaxed">
                Conversione media del modulo rispetto al form di contatto statico
              </p>
            </div>
            <div className="sm:px-10">
              <div className="display text-5xl">&lt; 60 sec</div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/70 leading-relaxed">
                Dalla configurazione dei parametri alla pubblicazione
              </p>
            </div>
            <div className="sm:pl-10">
              <div className="display text-5xl">1 rigo</div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/70 leading-relaxed">
                Di codice per incorporare il modulo nel tuo dominio
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Specifiche: registro a righe ——— */}
      <section id="funzioni" className="scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-6 pb-10">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-forest">
                02 — Specifiche di sistema
              </span>
              <h2 className="display mt-4 text-3xl sm:text-4xl text-ink max-w-xl leading-tight">
                Costruito come uno strumento di precisione.
              </h2>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              Tre componenti · Nessuna dipendenza superflua
            </p>
          </div>

          {features.map((f) => (
            <div
              key={f.n}
              className="group grid md:grid-cols-12 gap-y-4 md:gap-x-8 py-10 border-t border-hairline px-3 -mx-3 hover:bg-ink/[0.025] transition-colors"
            >
              <span className="display italic md:col-span-1 text-2xl text-ink-faint group-hover:text-forest transition-colors">
                {f.n}
              </span>
              <h3 className="font-serif text-2xl leading-snug text-ink md:col-span-4">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft md:col-span-6">
                {f.body}
              </p>
              <span className="md:col-span-1 justify-self-start md:justify-self-end self-start font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint border border-hairline px-1.5 py-0.5">
                {f.tag}
              </span>
            </div>
          ))}
          <div className="border-t border-hairline" />
        </div>
      </section>

      {/* ——— Chiusura ——— */}
      <section className="border-t-4 border-double border-ink/40">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
            Inizio rapido — piano gratuito disponibile
          </span>
          <h2 className="display mt-6 text-4xl sm:text-5xl text-ink">Apri il tuo registro.</h2>
          <p className="mt-5 text-sm leading-relaxed text-ink-soft max-w-md mx-auto">
            Crea il primo calcolatore, incorporalo nel tuo sito e ricevi il primo
            lead qualificato. Nessuna carta di credito richiesta.
          </p>
          <Link href="/login" className="btn btn-forest mt-9">
            Crea il primo calcolatore <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* ——— Colophon ——— */}
      <footer className="border-t border-hairline">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-2.5">
                <Mark />
                <span className="font-serif text-lg font-semibold tracking-tight">CalcFlow</span>
              </div>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-ink-soft">
                Strumenti di stima interattiva e acquisizione lead per aziende
                che prendono sul serio i propri numeri.
              </p>
            </div>

            <div className="flex gap-14">
              <div className="flex flex-col gap-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">
                <span className="text-[9px] tracking-[0.25em] text-ink-faint">Indice</span>
                <a href="#demo" className="hover:text-ink transition-colors">Dimostrazione</a>
                <a href="#funzioni" className="hover:text-ink transition-colors">Funzioni</a>
              </div>
              <div className="flex flex-col gap-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">
                <span className="text-[9px] tracking-[0.25em] text-ink-faint">Accesso</span>
                <Link href="/login" className="hover:text-ink transition-colors">Accedi</Link>
                <Link href="/dashboard" className="hover:text-ink transition-colors">Dashboard</Link>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-4 border-t border-hairline flex flex-col sm:flex-row justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
            <span>© 2026 CalcFlow — Tutti i diritti riservati</span>
            <span>Composto in Fraunces &amp; IBM Plex Mono. Nessun modulo statico è stato maltrattato.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}