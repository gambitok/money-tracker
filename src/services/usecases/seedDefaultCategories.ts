import { createCategoriesBulk, listCategories } from '@/services/repositories/categoriesRepository';
import type { TransactionType } from '@/types/domain';

type SeedCategory = { name: string; type: TransactionType; color: string; icon: string };

const DEFAULT_CATEGORIES: SeedCategory[] = [
  // Expense
  { name: 'Groceries', type: 'expense', color: '#2D9CDB', icon: 'cart-outline' },
  { name: 'Restaurants', type: 'expense', color: '#F2994A', icon: 'silverware-fork-knife' },
  { name: 'Coffee', type: 'expense', color: '#6F4E37', icon: 'coffee-outline' },
  { name: 'Transport', type: 'expense', color: '#56CCF2', icon: 'bus' },
  { name: 'Fuel', type: 'expense', color: '#EB5757', icon: 'gas-station-outline' },
  { name: 'Rent', type: 'expense', color: '#9B51E0', icon: 'home-outline' },
  { name: 'Utilities', type: 'expense', color: '#BB6BD9', icon: 'lightning-bolt-outline' },
  { name: 'Internet & Phone', type: 'expense', color: '#2F80ED', icon: 'cellphone' },
  { name: 'Subscriptions', type: 'expense', color: '#4F4F4F', icon: 'credit-card-outline' },
  { name: 'Health', type: 'expense', color: '#27AE60', icon: 'heart-pulse' },
  { name: 'Insurance', type: 'expense', color: '#219653', icon: 'shield-check-outline' },
  { name: 'Shopping', type: 'expense', color: '#F2C94C', icon: 'shopping-outline' },
  { name: 'Entertainment', type: 'expense', color: '#D946EF', icon: 'movie-open-outline' },
  { name: 'Travel', type: 'expense', color: '#14B8A6', icon: 'airplane' },
  { name: 'Education', type: 'expense', color: '#111827', icon: 'school-outline' },
  { name: 'Gifts', type: 'expense', color: '#EF4444', icon: 'gift-outline' },

  // Income
  { name: 'Salary', type: 'income', color: '#16A34A', icon: 'cash' },
  { name: 'Bonus', type: 'income', color: '#22C55E', icon: 'cash-plus' },
  { name: 'Freelance', type: 'income', color: '#0EA5E9', icon: 'laptop' },
  { name: 'Investments', type: 'income', color: '#6366F1', icon: 'chart-line' },
  { name: 'Gifts', type: 'income', color: '#F97316', icon: 'gift-outline' },
];

export async function seedDefaultCategoriesIfEmpty(userId: string) {
  const existing = await listCategories({ userId });
  if (existing.length > 0) return { seeded: false, count: 0 };

  const created = await createCategoriesBulk({ userId, categories: DEFAULT_CATEGORIES });
  return { seeded: true, count: created.length };
}

