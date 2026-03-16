import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/providers/SessionProvider';
import { getUserProfile } from '@/services/repositories/userRepository';

export function useProfile() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: userId ? ['profile', userId] : ['profile', 'no-user'],
    enabled: !!userId,
    queryFn: async () => getUserProfile(userId!),
  });
}

