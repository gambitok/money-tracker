import React, { useEffect } from 'react';

import { useSyncRecurringTransactions } from '@/hooks/useRecurringTransactions';

export function RecurringSyncGate({ children }: { children: React.ReactNode }) {
  const syncRecurring = useSyncRecurringTransactions();

  useEffect(() => {
    if (!syncRecurring.isIdle) return;
    syncRecurring.mutate();
  }, [syncRecurring]);

  return children;
}
