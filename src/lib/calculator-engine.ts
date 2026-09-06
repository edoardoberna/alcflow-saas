export interface SelectOption {
  label: string;
  value: number;
}

export interface CalculatorInput {
  id: string;
  variable: string;
  type: 'slider' | 'number' | 'select';
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  options?: SelectOption[];
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
 * Interprete matematico avanzato:
 * Supporta variabili, operatori (+, -, *, /, %), comparazioni (>, <, >=, <=, ==, !=),
 * logica condizionale ternaria (a > b ? x : y) e funzioni Math (min, max, round, floor, ceil, abs).
 */
export function evaluateOutputs(
  outputs: CalculatorOutput[],
  inputsValues: Record<string, number>
): Record<string, number> {
  const results: Record<string, number> = { ...inputsValues };

  outputs.forEach((out) => {
    try {
      let expression = out.formula;

      // Sostituisce funzioni matematiche comuni con la controparte Math.*
      expression = expression
        .replace(/\bmin\(/g, 'Math.min(')
        .replace(/\bmax\(/g, 'Math.max(')
        .replace(/\bround\(/g, 'Math.round(')
        .replace(/\bfloor\(/g, 'Math.floor(')
        .replace(/\bceil\(/g, 'Math.ceil(')
        .replace(/\babs\(/g, 'Math.abs(');

      // Sostituisce le variabili con i valori correnti (dalla più lunga alla più corta per evitare sovrapposizioni)
      const sortedKeys = Object.keys(results).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expression = expression.replace(regex, (results[key] ?? 0).toString());
      }

      // Validazione caratteri consentiti (numeri, operatori, logica ternaria e Math)
      const isValid = /^[\d+\-*/().?:><=!&|,\s]|Math\.(min|max|round|floor|ceil|abs)+$/.test(expression);

      if (isValid) {
        // eslint-disable-next-line no-new-func
        const calculatedValue = Function(`"use strict"; return (${expression})`)();
        results[out.variable] = typeof calculatedValue === 'number' && !isNaN(calculatedValue)
          ? Math.round(calculatedValue * 100) / 100
          : 0;
      } else {
        results[out.variable] = 0;
      }
    } catch {
      results[out.variable] = 0;
    }
  });

  return results;
}