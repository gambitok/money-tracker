import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isValid, parse } from 'date-fns';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Card, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import type { TransactionType } from '@/types/domain';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { toISODate } from '@/utils/dates';
import { SelectField, type SelectOption } from '@/components/fields/SelectField';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  currency: z.string().min(3).max(3),
  categoryId: z.string().uuid().nullable(),
  description: z.string().max(140).optional(),
  date: z.date(),
});

type FormValues = z.infer<typeof schema>;

const commonCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

export function AddTransactionScreen() {
  const router = useRouter();
  const createTx = useCreateTransaction();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [webDateValue, setWebDateValue] = useState(format(new Date(), 'yyyy-MM-dd'));
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/transactions');
  };

  const {
    control,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      amount: '',
      currency: 'USD',
      categoryId: null,
      description: '',
      date: new Date(),
    },
  });

  const type = watch('type') as TransactionType;
  const selectedDate = watch('date');
  const { data: categories } = useCategories(type);

  const currencyOptions = useMemo<SelectOption<string>[]>(
    () => commonCurrencies.map((c) => ({ value: c, label: c, leadingIcon: 'currency-usd' })),
    []
  );

  const categoryOptions = useMemo<SelectOption<string>[]>(() => {
    return (categories ?? []).map((c) => ({
      value: c.id,
      label: c.name,
      leadingIcon: c.icon ?? 'tag-outline',
      leadingColor: c.color ?? undefined,
    }));
  }, [categories]);

  const onSubmit = useMemo(
    () =>
      handleSubmit(async (v) => {
        setServerError(null);
        try {
          await createTx.mutateAsync({
            type: v.type,
            amount: Number(v.amount),
            currency: v.currency,
            categoryId: v.categoryId,
            description: v.description?.trim() ? v.description.trim() : null,
            date: toISODate(v.date),
          });
          handleBack();
        } catch (e) {
          setServerError(e instanceof Error ? e.message : 'Failed to add transaction');
        }
      }),
    [createTx, handleSubmit, router]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Button mode="text" onPress={handleBack}>
          Back
        </Button>
        <Text variant="headlineSmall">Add transaction</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Controller
            control={control}
            name="type"
            render={({ field: { value, onChange } }) => (
              <SegmentedButtons
                value={value}
                onValueChange={(v) => onChange(v as TransactionType)}
                buttons={[
                  { value: 'expense', label: 'Expense' },
                  { value: 'income', label: 'Income' },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                label="Amount"
                mode="outlined"
                keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric', default: 'numeric' })}
                value={value}
                onBlur={onBlur}
                onChangeText={(t) => onChange(t)}
                error={!!errors.amount}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.amount}>
            {errors.amount?.message}
          </HelperText>

          <Controller
            control={control}
            name="currency"
            render={({ field: { onChange, value } }) => (
              <SelectField
                label="Currency"
                value={value}
                options={currencyOptions}
                onChange={(v) => onChange(v ?? 'USD')}
              />
            )}
          />

          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <SelectField
                label="Category"
                value={value}
                options={categoryOptions}
                allowNull
                nullLabel="Uncategorized"
                placeholder="Select category"
                onChange={onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                label="Description (optional)"
                mode="outlined"
                value={value ?? ''}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.description}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.description}>
            {errors.description?.message}
          </HelperText>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium">Date</Text>
          <Button mode="outlined" onPress={() => setShowDatePicker((v) => !v)}>
            {showDatePicker ? 'Hide date picker' : format(selectedDate, 'dd MMM yyyy')}
          </Button>

          {Platform.OS === 'web' ? (
            <TextInput
              label="Transaction date"
              mode="outlined"
              value={webDateValue}
              placeholder="YYYY-MM-DD"
              onChangeText={(value) => {
                setWebDateValue(value);
                const parsed = parse(value, 'yyyy-MM-dd', new Date());
                if (isValid(parsed)) {
                  setValue('date', parsed, { shouldValidate: true });
                }
              }}
            />
          ) : null}

          {showDatePicker && Platform.OS !== 'web' ? (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              onChange={(_e, d) => {
                if (d) {
                  setValue('date', d, { shouldValidate: true });
                  setWebDateValue(format(d, 'yyyy-MM-dd'));
                }
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }
              }}
            />
          ) : null}
        </Card.Content>
      </Card>

      <HelperText type="error" visible={!!serverError}>
        {serverError}
      </HelperText>

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={isSubmitting || createTx.isPending}
        disabled={isSubmitting || createTx.isPending}>
        Save
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 64,
  },
  card: {
    borderRadius: 24,
  },
  cardContent: {
    gap: 10,
  },
});
