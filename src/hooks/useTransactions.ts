import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/providers/SessionProvider';
import type { DateRangePreset } from '@/utils/dates';
import { getPresetRange } from '@/utils/dates';
import type { TransactionType } from '@/types/domain';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
} from '@/services/repositories/transactionsRepository';

const keys = {
  transactions: (userId: string, preset: DateRangePreset, from: string, to: string) =>
    ['transactions', userId, preset, from, to] as const,
  transaction: (userId: string, transactionId: string) => ['transaction', userId, transactionId] as const,
};

export function useTransactions(preset: DateRangePreset) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const { from, to } = getPresetRange(preset);

  return useQuery({
    queryKey: userId ? keys.transactions(userId, preset, from, to) : ['transactions', 'no-user'],
    enabled: !!userId,
    queryFn: async () => listTransactions({ userId: userId!, from, to }),
  });
}

export function useTransaction(transactionId?: string) {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey:
      userId && transactionId ? keys.transaction(userId, transactionId) : ['transaction', 'no-user', transactionId],
    enabled: !!userId && !!transactionId,
    queryFn: async () => getTransaction({ userId: userId!, transactionId: transactionId! }),
  });
}

async function invalidateTransactionQueries(qc: ReturnType<typeof useQueryClient>, userId: string) {
  await qc.invalidateQueries({ queryKey: ['transactions', userId] });
  await qc.invalidateQueries({ queryKey: ['transaction', userId] });
  await qc.invalidateQueries({ queryKey: ['feed', userId] });
  await qc.invalidateQueries({ queryKey: ['dashboard', userId] });
  await qc.invalidateQueries({ queryKey: ['reports', userId] });
}

export function useCreateTransaction() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      type: TransactionType;
      amount: number;
      currency: string;
      categoryId: string | null;
      description?: string | null;
      date: string;
    }) => {
      if (!userId) throw new Error('Not signed in');
      return createTransaction({ userId, ...input });
    },
    onSuccess: async () => {
      if (!userId) return;
      await invalidateTransactionQueries(qc, userId);
    },
  });
}

export function useUpdateTransaction(transactionId: string) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      type: TransactionType;
      amount: number;
      currency: string;
      categoryId: string | null;
      description?: string | null;
      date: string;
    }) => {
      if (!userId) throw new Error('Not signed in');
      return updateTransaction({ userId, transactionId, ...input });
    },
    onSuccess: async () => {
      if (!userId) return;
      await invalidateTransactionQueries(qc, userId);
    },
  });
}

export function useDeleteTransaction(transactionId: string) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not signed in');
      return deleteTransaction({ userId, transactionId });
    },
    onSuccess: async () => {
      if (!userId) return;
      await invalidateTransactionQueries(qc, userId);
    },
  });
}
