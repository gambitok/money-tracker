import { supabase } from '@/services/supabase/client';

export type UserProfile = {
  id: string;
  email: string;
  base_currency: string;
  created_at?: string;
};

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id,email,base_currency,created_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as UserProfile;
}

