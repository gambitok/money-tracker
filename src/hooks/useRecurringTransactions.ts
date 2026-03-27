import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/providers/SessionProvider';
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  listRecurringTransactions,
  syncRecurringTransactions,
} from '@/services/repositories/recurringTransactionsRepository';

export function useRecurringTransactions() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: userId ? ['recurring-transactions', userId] : ['recurring-transactions', 'no-user'],
    enabled: !!userId,
    queryFn: async () => listRecurringTransactions({ userId: userId! }),
  });
}

export function useCreateRecurringTransaction() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      type: 'income' | 'expense';
      amount: number;
      currency: string;
      categoryId: string | null;
      description?: string | null;
      startDate: string;
    }) => {
      if (!userId) throw new Error('Not signed in');
      return createRecurringTransaction({ userId, ...input });
    },
    onSuccess: async () => {
      if (!userId) return;
      await qc.invalidateQueries({ queryKey: ['recurring-transactions', userId] });
    },
  });
}

export function useDeleteRecurringTransaction() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (recurringId: string) => {
      if (!userId) throw new Error('Not signed in');
      return deleteRecurringTransaction({ userId, recurringId });
    },
    onSuccess: async () => {
      if (!userId) return;
      await qc.invalidateQueries({ queryKey: ['recurring-transactions', userId] });
    },
  });
}

export function useSyncRecurringTransactions() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) return [];
      return syncRecurringTransactions({ userId, today: new Date() });
    },
    onSuccess: async () => {
      if (!userId) return;
      await qc.invalidateQueries({ queryKey: ['transactions', userId] });
      await qc.invalidateQueries({ queryKey: ['feed', userId] });
      await qc.invalidateQueries({ queryKey: ['reports', userId] });
      await qc.invalidateQueries({ queryKey: ['recurring-transactions', userId] });
    },
  });
}
