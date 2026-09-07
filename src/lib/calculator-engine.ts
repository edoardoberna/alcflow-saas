import { evaluate } from 'mathjs';

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
    const expression = formula.trim();

    // Il parser matematico non esegue JavaScript. Rifiutiamo comunque costrutti
    // non pertinenti al builder prima di passare l'espressione a mathjs.
    if (!expression || /[;={}\[\]"'`]|\b(?:import|function|loop|while|delete)\b/i.test(expression)) {
      return 0;
    }

    const values = Object.fromEntries(
      Object.entries(scope).map(([key, value]) => {
        const numericValue = Number(value);
        return [key, Number.isFinite(numericValue) ? numericValue : 0];
      })
    );
    const result = Number(evaluate(expression, values));

    // Guardia anti-divisione per zero e valori non finiti
    if (isNaN(result) || !isFinite(result)) {
      return 0;
    }

    return result;
  } catch {
    return 0;
  }
}