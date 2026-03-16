import { supabase } from '@/services/supabase/client';

export type ExchangeRateRow = {
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
};

export async function listExchangeRates(params: { toCurrency: string; fromCurrencies: string[] }) {
  if (params.fromCurrencies.length === 0) return [] as ExchangeRateRow[];

  const { data, error } = await supabase
    .from('exchange_rates')
    .select('from_currency,to_currency,rate,updated_at')
    .eq('to_currency', params.toCurrency)
    .in('from_currency', params.fromCurrencies);

  if (error) throw error;
  return (data ?? []) as ExchangeRateRow[];
}

