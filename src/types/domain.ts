export type TransactionType = 'income' | 'expense';

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string | null;
  icon: string | null;
  created_at?: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category_id: string | null;
  description: string | null;
  date: string; // yyyy-mm-dd
  created_at?: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  month: string; // yyyy-mm-dd, first day of month
  amount: number;
  created_at?: string;
};
