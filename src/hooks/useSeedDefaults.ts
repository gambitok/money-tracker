import { useEffect, useRef } from 'react';

import { useSession } from '@/providers/SessionProvider';
import { seedDefaultCategoriesIfEmpty } from '@/services/usecases/seedDefaultCategories';

export function useSeedDefaults() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const didRun = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (didRun.current) return;
    didRun.current = true;

    seedDefaultCategoriesIfEmpty(userId).catch(() => {
      // Non-blocking: app still works even if seeding fails.
    });
  }, [userId]);
}

