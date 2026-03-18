import { supabase } from '@/services/supabase/client';
import type { Transaction, TransactionType } from '@/types/domain';

export async function createTransaction(params: {
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId: string | null;
  description?: string | null;
  date: string; // yyyy-mm-dd
}) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: params.userId,
      type: params.type,
      amount: params.amount,
      currency: params.currency,
      category_id: params.categoryId,
      description: params.description ?? null,
      date: params.date,
    })
    .select('id,user_id,type,amount,currency,category_id,description,date,created_at')
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function getTransaction(params: { userId: string; transactionId: string }) {
  const { data, error } = await supabase
    .from('transactions')
    .select('id,user_id,type,amount,currency,category_id,description,date,created_at')
    .eq('user_id', params.userId)
    .eq('id', params.transactionId)
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function updateTransaction(params: {
  userId: string;
  transactionId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId: string | null;
  description?: string | null;
  date: string;
}) {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      type: params.type,
      amount: params.amount,
      currency: params.currency,
      category_id: params.categoryId,
      description: params.description ?? null,
      date: params.date,
    })
    .eq('user_id', params.userId)
    .eq('id', params.transactionId)
    .select('id,user_id,type,amount,currency,category_id,description,date,created_at')
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(params: { userId: string; transactionId: string }) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', params.userId)
    .eq('id', params.transactionId);

  if (error) throw error;
}

export async function listTransactions(params: { userId: string; from: string; to: string }) {
  const { data, error } = await supabase
    .from('transactions')
    .select('id,user_id,type,amount,currency,category_id,description,date,created_at')
    .eq('user_id', params.userId)
    .gte('date', params.from)
    .lte('date', params.to)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function listAllTransactionsForUser(params: { userId: string }) {
  const pageSize = 1000;
  let from = 0;
  const out: Transaction[] = [];

  // Fetch all rows in pages (good enough for personal finance scale).
  // If you later need server-side aggregation, we can replace with an RPC.
  while (true) {
    const { data, error } = await supabase
      .from('transactions')
      .select('id,user_id,type,amount,currency,category_id,description,date,created_at')
      .eq('user_id', params.userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const page = (data ?? []) as Transaction[];
    out.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return out;
}
