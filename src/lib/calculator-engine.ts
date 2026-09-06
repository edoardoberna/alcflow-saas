export interface CalculatorInput {
  id: string;
  variable: string;
  type: 'slider' | 'number' | 'select';
  label: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  options?: { label: string; value: number }[];
}

export interface CalculatorOutput {
  id: string;
  variable: string;
  label: string;
  formula: string;
  prefix?: string;
  suffix?: string;
  highlight?: boolean;
}

/**
 * Valuta un'espressione matematica deterministica in modo sicuro
 * Previene crash da divisione per zero, variabili non definite o NaN.
 */
export function evaluateFormula(
  formula: string,
  scope: Record<string, number>
): number {
  if (!formula || typeof formula !== 'string') return 0;

  try {
    let sanitized = formula.trim();

    // Sostituzione delle variabili dello scope con i rispettivi valori numerici
    // Ordinamento decrescente per lunghezza per evitare collisioni di sottostringhe
    const sortedVars = Object.keys(scope).sort((a, b) => b.length - a.length);

    for (const v of sortedVars) {
      const val = Number(scope[v]);
      const safeVal = isNaN(val) || !isFinite(val) ? 0 : val;
      // Sostituisce la variabile solo se delimitata da caratteri non alfanumerici
      const regex = new RegExp(`\\b${v}\\b`, 'g');
      sanitized = sanitized.replace(regex, `(${safeVal})`);
    }

    // Supporto per funzioni min() e max()
    sanitized = sanitized.replace(/\bmin\s*\(/g, 'Math.min(');
    sanitized = sanitized.replace(/\bmax\s*\(/g, 'Math.max(');

    // Whitelist di sicurezza: ammessi solo numeri, operatori matematici, parentesi, Math e ternari
    const isSafe = /^[\d\s\+\-\*\/\%\(\)\?\:\.\,\>\<\=\!\&\|Mathminax]+$/.test(sanitized);
    if (!isSafe) {
      return 0;
    }

    // Valutazione matematica isolata
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const result = Number(fn());

    // Guardia anti-divisione per zero e valori non finiti
    if (isNaN(result) || !isFinite(result)) {
      return 0;
    }

    return result;
  } catch {
    return 0;
  }
}