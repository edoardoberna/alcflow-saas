export interface CalculatorInput {
  id: string;
  variable: string;
  label: string;
  type: 'slider' | 'number' | 'select';
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
 * Valuta in sicurezza un'espressione matematica sostituendo i valori delle variabili
 */
export function evaluateFormula(
  formula: string,
  values: Record<string, number>
): number {
  if (!formula || typeof formula !== 'string') return 0;

  try {
    let sanitized = formula.trim();

    // Sostituisce le variabili ordinate per lunghezza decrescente per evitare conflitti
    const sortedKeys = Object.keys(values).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      sanitized = sanitized.replace(regex, String(values[key] ?? 0));
    }

    // Consente solo cifre, operatori aritmetici, parentesi e logica ternaria base
    if (!/^[0-9+\-*/().?:><=! \t]+$/.test(sanitized)) {
      return 0;
    }

    // Valutazione matematica isolata
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const result = fn();
    const num = Number(result);

    return isNaN(num) || !isFinite(num) ? 0 : num;
  } catch {
    return 0;
  }
}