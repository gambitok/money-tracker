import type { ExchangeRateRow } from '@/services/repositories/exchangeRatesRepository';

export type ConversionResult = { amount: number; missingRates: string[] };

export function buildRatesMap(rates: ExchangeRateRow[]) {
  const map = new Map<string, number>();
  for (const r of rates) {
    map.set(`${r.from_currency}->${r.to_currency}`, Number(r.rate));
  }
  return map;
}

export function convertToBase(params: {
  amount: number;
  fromCurrency: string;
  baseCurrency: string;
  rates: Map<string, number>;
}): ConversionResult {
  const from = params.fromCurrency.toUpperCase();
  const base = params.baseCurrency.toUpperCase();
  if (from === base) return { amount: params.amount, missingRates: [] };

  const key = `${from}->${base}`;
  const rate = params.rates.get(key);
  if (!rate) return { amount: 0, missingRates: [key] };

  return { amount: params.amount * rate, missingRates: [] };
}

