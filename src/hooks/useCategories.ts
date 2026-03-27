import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/providers/SessionProvider';
import type { TransactionType } from '@/types/domain';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/services/repositories/categoriesRepository';

const keys = {
  categories: (userId: string, type?: TransactionType) => ['categories', userId, type] as const,
};

export function useCategories(type?: TransactionType) {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: userId ? keys.categories(userId, type) : ['categories', 'no-user'],
    enabled: !!userId,
    queryFn: async () => listCategories({ userId: userId!, type }),
  });
}

export function useCreateCategory() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; type: TransactionType; color?: string | null; icon?: string | null }) => {
      if (!userId) throw new Error('Not signed in');
      return createCategory({ userId, ...input });
    },
    onSuccess: async () => {
      if (!userId) return;
      await qc.invalidateQueries({ queryKey: ['categories', userId] });
    },
  });
}

export function useUpdateCategory(categoryId: string) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; type: TransactionType; color?: string | null; icon?: string | null }) => {
      if (!userId) throw new Error('Not signed in');
      return updateCategory({ userId, categoryId, ...input });
    },
    onSuccess: async () => {
      if (!userId) return;
      await qc.invalidateQueries({ queryKey: ['categories', userId] });
      await qc.invalidateQueries({ queryKey: ['feed', userId] });
      await qc.invalidateQueries({ queryKey: ['reports', userId] });
    },
  });
}

export function useDeleteCategory() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!userId) throw new Error('Not signed in');
      return deleteCategory({ userId, categoryId });
    },
    onSuccess: async () => {
      if (!userId) return;
      await qc.invalidateQueries({ queryKey: ['categories', userId] });
      await qc.invalidateQueries({ queryKey: ['feed', userId] });
      await qc.invalidateQueries({ queryKey: ['reports', userId] });
    },
  });
}
