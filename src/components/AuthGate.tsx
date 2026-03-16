import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { useSession } from '@/providers/SessionProvider';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { session, initializing } = useSession();

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isAuthed = !!session?.user;

    if (!isAuthed && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (isAuthed && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [initializing, router, segments, session?.user]);

  return children;
}

