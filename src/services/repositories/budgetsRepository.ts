import { supabase } from '@/services/supabase/client';
import type { Budget } from '@/types/domain';

export async function listBudgets(params: { userId: string; month: string }) {
  const { data, error } = await supabase
    .from('budgets')
    .select('id,user_id,category_id,month,amount,created_at')
    .eq('user_id', params.userId)
    .eq('month', params.month)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Budget[];
}

export async function upsertBudget(params: {
  userId: string;
  categoryId: string;
  month: string;
  amount: number;
}) {
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      {
        user_id: params.userId,
        category_id: params.categoryId,
        month: params.month,
        amount: params.amount,
      },
      { onConflict: 'user_id,category_id,month' }
    )
    .select('id,user_id,category_id,month,amount,created_at')
    .single();

  if (error) throw error;
  return data as Budget;
}

export async function deleteBudget(params: { userId: string; budgetId: string }) {
  const { error } = await supabase.from('budgets').delete().eq('user_id', params.userId).eq('id', params.budgetId);
  if (error) throw error;
}
