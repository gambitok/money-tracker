import React from 'react';

import { useSeedDefaults } from '@/hooks/useSeedDefaults';

export function SeedDefaultsGate({ children }: { children: React.ReactNode }) {
  useSeedDefaults();
  return children;
}

