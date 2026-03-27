import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, type MD3Theme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider } from '@/providers/SessionProvider';
import { SeedDefaultsGate } from '@/components/SeedDefaultsGate';
import { FeedbackProvider } from '@/providers/FeedbackProvider';
import { RecurringSyncGate } from '@/components/RecurringSyncGate';

export function AppProviders({ children, theme }: { children: React.ReactNode; theme: MD3Theme }) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <FeedbackProvider>
            <SessionProvider>
              <SeedDefaultsGate>
                <RecurringSyncGate>{children}</RecurringSyncGate>
              </SeedDefaultsGate>
            </SessionProvider>
          </FeedbackProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
