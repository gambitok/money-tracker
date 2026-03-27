import { addMonths, format, parseISO } from 'date-fns';

import { supabase } from '@/services/supabase/client';
import type { RecurringTransaction, Transaction } from '@/types/domain';

const recurringSelect = 'id,user_id,type,amount,currency,category_id,description,frequency,start_date,next_run_date,active,created_at';
const transactionSelect = 'id,user_id,type,amount,currency,category_id,description,date,created_at';

export async function listRecurringTransactions(params: { userId: string }) {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select(recurringSelect)
    .eq('user_id', params.userId)
    .order('next_run_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as RecurringTransaction[];
}

export async function createRecurringTransaction(params: {
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  categoryId: string | null;
  description?: string | null;
  startDate: string;
}) {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert({
      user_id: params.userId,
      type: params.type,
      amount: params.amount,
      currency: params.currency,
      category_id: params.categoryId,
      description: params.description ?? null,
      frequency: 'monthly',
      start_date: params.startDate,
      next_run_date: params.startDate,
      active: true,
    })
    .select(recurringSelect)
    .single();

  if (error) throw error;
  return data as RecurringTransaction;
}

export async function deleteRecurringTransaction(params: { userId: string; recurringId: string }) {
  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('user_id', params.userId)
    .eq('id', params.recurringId);

  if (error) throw error;
}

export async function syncRecurringTransactions(params: { userId: string; today: Date }) {
  const todayIso = format(params.today, 'yyyy-MM-dd');
  const recurringItems = await listRecurringTransactions({ userId: params.userId });
  const dueItems = recurringItems.filter((item) => item.active && item.next_run_date <= todayIso);
  if (!dueItems.length) return [] as Transaction[];

  const created: Transaction[] = [];

  for (const item of dueItems) {
    let nextRun = parseISO(item.next_run_date);

    while (format(nextRun, 'yyyy-MM-dd') <= todayIso) {
      const nextRunIso = format(nextRun, 'yyyy-MM-dd');
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', params.userId)
        .eq('date', nextRunIso)
        .eq('type', item.type)
        .eq('amount', item.amount)
        .eq('currency', item.currency)
        .eq('description', item.description ?? null)
        .eq('category_id', item.category_id)
        .maybeSingle();

      if (!existing) {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: params.userId,
            type: item.type,
            amount: item.amount,
            currency: item.currency,
            category_id: item.category_id,
            description: item.description ?? null,
            date: nextRunIso,
          })
          .select(transactionSelect)
          .single();

        if (error) throw error;
        created.push(data as Transaction);
      }

      nextRun = addMonths(nextRun, 1);
    }

    const { error: updateError } = await supabase
      .from('recurring_transactions')
      .update({ next_run_date: format(nextRun, 'yyyy-MM-dd') })
      .eq('user_id', params.userId)
      .eq('id', item.id);

    if (updateError) throw updateError;
  }

  return created;
}
