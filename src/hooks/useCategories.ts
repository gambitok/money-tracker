import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/providers/SessionProvider';
import type { TransactionType } from '@/types/domain';
import { createCategory, listCategories } from '@/services/repositories/categoriesRepository';

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
    mutationFn: async (input: { name: string; type: TransactionType; color?: string | null }) => {
      if (!userId) throw new Error('Not signed in');
      return createCategory({ userId, ...input });
    },
    onSuccess: async () => {
      if (!userId) return;
      await qc.invalidateQueries({ queryKey: ['categories', userId] });
    },
  });
}

