import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';

import { useSession } from '@/providers/SessionProvider';
import { deleteBudget, listBudgets, upsertBudget } from '@/services/repositories/budgetsRepository';

const keys = {
  budgets: (userId: string, month: string) => ['budgets', userId, month] as const,
};

export function useBudgets(monthDate: Date) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const month = format(startOfMonth(monthDate), 'yyyy-MM-dd');

  return useQuery({
    queryKey: userId ? keys.budgets(userId, month) : ['budgets', 'no-user', month],
    enabled: !!userId,
    queryFn: async () => listBudgets({ userId: userId!, month }),
  });
}

export function useUpsertBudget(monthDate: Date) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();
  const month = format(startOfMonth(monthDate), 'yyyy-MM-dd');

  return useMutation({
    mutationFn: async (input: { categoryId: string; amount: number }) => {
      if (!userId) throw new Error('Not signed in');
      return upsertBudget({ userId, month, ...input });
    },
    onSuccess: async () => {
      if (!userId) return;
      await qc.invalidateQueries({ queryKey: ['budgets', userId] });
      await qc.invalidateQueries({ queryKey: ['reports', userId] });
    },
  });
}

export function useDeleteBudget() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (budgetId: string) => {
      if (!userId) throw new Error('Not signed in');
      return deleteBudget({ userId, budgetId });
    },
    onSuccess: async () => {
      if (!userId) return;
      await qc.invalidateQueries({ queryKey: ['budgets', userId] });
      await qc.invalidateQueries({ queryKey: ['reports', userId] });
    },
  });
}
