import type { Category, TransactionType } from '@/types/domain';
import { supabase } from '@/services/supabase/client';

export async function listCategories(params: { userId: string; type?: TransactionType }) {
  const query = supabase
    .from('categories')
    .select('id,user_id,name,type,color,icon,created_at')
    .eq('user_id', params.userId)
    .order('name', { ascending: true });

  const { data, error } = params.type ? await query.eq('type', params.type) : await query;
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(params: {
  userId: string;
  name: string;
  type: TransactionType;
  color?: string | null;
  icon?: string | null;
}) {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: params.userId,
      name: params.name,
      type: params.type,
      color: params.color ?? null,
      icon: params.icon ?? null,
    })
    .select('id,user_id,name,type,color,icon,created_at')
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(params: {
  userId: string;
  categoryId: string;
  name: string;
  type: TransactionType;
  color?: string | null;
  icon?: string | null;
}) {
  const { data, error } = await supabase
    .from('categories')
    .update({
      name: params.name,
      type: params.type,
      color: params.color ?? null,
      icon: params.icon ?? null,
    })
    .eq('user_id', params.userId)
    .eq('id', params.categoryId)
    .select('id,user_id,name,type,color,icon,created_at')
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(params: { userId: string; categoryId: string }) {
  const { error } = await supabase.from('categories').delete().eq('user_id', params.userId).eq('id', params.categoryId);
  if (error) throw error;
}

export async function createCategoriesBulk(params: {
  userId: string;
  categories: Array<{ name: string; type: TransactionType; color: string; icon: string }>;
}) {
  if (params.categories.length === 0) return [] as Category[];

  const { data, error } = await supabase
    .from('categories')
    .insert(
      params.categories.map((c) => ({
        user_id: params.userId,
        name: c.name,
        type: c.type,
        color: c.color,
        icon: c.icon,
      }))
    )
    .select('id,user_id,name,type,color,icon,created_at');

  if (error) throw error;
  return (data ?? []) as Category[];
}
