# Money Tracker (Expo + Supabase)

Personal finance tracker built with **Expo Router**, **React Native**, **TypeScript**, **Supabase**, and **Victory Native**.

## Prerequisites
- A Supabase project (URL + anon key)
- Database schema applied from `supabase/schema.sql`

## Setup
1. Install dependencies:

```bash
npm install
```

2. Create a local env file:

```bash
cp .env.example .env
```

3. Fill in:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

4. Start the app:

```bash
npm run start
```

## App routes (Expo Router)
- Auth: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`
- Tabs: `app/(tabs)/dashboard.tsx`, `app/(tabs)/transactions.tsx`, `app/(tabs)/reports.tsx`
- Modals: `app/transaction/new.tsx`, `app/categories.tsx`

