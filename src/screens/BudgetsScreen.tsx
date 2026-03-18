import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { addMonths, format } from 'date-fns';
import { Button, Card, HelperText, List, Text, TextInput } from 'react-native-paper';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { useCategories } from '@/hooks/useCategories';
import { useBudgets, useDeleteBudget, useUpsertBudget } from '@/hooks/useBudgets';
import { SelectField, type SelectOption } from '@/components/fields/SelectField';

const schema = z.object({
  categoryId: z.string().uuid('Select a category'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, 'Enter a valid amount'),
});

type FormValues = z.infer<typeof schema>;

export function BudgetsScreen() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [serverError, setServerError] = useState<string | null>(null);
  const { data: categories } = useCategories('expense');
  const { data: budgets, isLoading, error } = useBudgets(monthDate);
  const upsertBudget = useUpsertBudget(monthDate);
  const deleteBudget = useDeleteBudget();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: '', amount: '' },
  });

  const categoryOptions = useMemo<SelectOption<string>[]>(
    () =>
      (categories ?? []).map((category) => ({
        value: category.id,
        label: category.name,
        leadingColor: category.color ?? undefined,
      })),
    [categories]
  );

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories ?? []) map.set(category.id, category.name);
    return map;
  }, [categories]);

  const monthLabel = format(monthDate, 'LLLL yyyy');
  const canGoNextMonth = format(addMonths(monthDate, 1), 'yyyy-MM') <= format(new Date(), 'yyyy-MM');

  const onSubmit = useMemo(
    () =>
      handleSubmit(async (values) => {
        setServerError(null);
        try {
          await upsertBudget.mutateAsync({
            categoryId: values.categoryId,
            amount: Number(values.amount),
          });
          reset({ categoryId: '', amount: '' });
        } catch (e) {
          setServerError(e instanceof Error ? e.message : 'Failed to save budget');
        }
      }),
    [handleSubmit, reset, upsertBudget]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">Budgets</Text>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.periodLabel}>Selected month</Text>
          <View style={styles.monthSwitch}>
            <Button mode="text" onPress={() => setMonthDate((current) => addMonths(current, -1))}>
              ‹
            </Button>
            <Text variant="titleLarge">{monthLabel}</Text>
            <Button mode="text" onPress={() => setMonthDate((current) => addMonths(current, 1))} disabled={!canGoNextMonth}>
              ›
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium">Set monthly budget</Text>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { value, onChange } }) => (
              <SelectField
                label="Expense category"
                value={value || null}
                options={categoryOptions}
                placeholder="Select category"
                onChange={(nextValue) => onChange(nextValue ?? '')}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.categoryId}>
            {errors.categoryId?.message}
          </HelperText>

          <Controller
            control={control}
            name="amount"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput label="Budget amount" mode="outlined" value={value} onBlur={onBlur} onChangeText={onChange} />
            )}
          />
          <HelperText type="error" visible={!!errors.amount}>
            {errors.amount?.message}
          </HelperText>
          <HelperText type="error" visible={!!serverError}>
            {serverError}
          </HelperText>

          <Button mode="contained" onPress={onSubmit} loading={isSubmitting || upsertBudget.isPending}>
            Save budget
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium">This month</Text>
          {isLoading ? <Text>Loading…</Text> : null}
          {error ? <Text>Failed to load budgets.</Text> : null}
          {!isLoading && !error && !(budgets ?? []).length ? <Text style={styles.subtitle}>No budgets yet for this month.</Text> : null}
          {(budgets ?? []).map((budget) => (
            <List.Item
              key={budget.id}
              title={categoryNameById.get(budget.category_id) ?? 'Category'}
              description={`${Number(budget.amount).toFixed(2)} budgeted`}
              right={() => (
                <Button mode="text" textColor="#D14B61" onPress={() => deleteBudget.mutate(budget.id)}>
                  Delete
                </Button>
              )}
            />
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, paddingBottom: 32 },
  card: { borderRadius: 20 },
  cardContent: { gap: 12 },
  periodLabel: {
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
  },
  monthSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: { opacity: 0.7 },
});
